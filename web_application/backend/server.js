const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const natural = require('natural');

const client = require('mongodb').MongoClient;
const neo4j = require('neo4j-driver');
const RedisClient = require('redis').createClient;

const app = express();
const port = process.env.PORT || 3000;

const basePath = path.resolve(__dirname, '..');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(basePath, 'frontend', 'build')));

const rank_weights = [0.55, 0.25, 0.2]

const dbUri = 'mongodb://localhost:27017/';    //sudo systemctl start mongod
const redis = RedisClient(27018, 'localhost'); //redis-server --maxmemory 10GB --maxmemory-policy allkeys-lru --port 27018
const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'password')
)

redis.on("error", (err) => {
    throw err;
 });

mergeIntersect = (L1, L2) => {
    R = []
    var i = 0; var j = 0; var u = L1[0]; var v = L2[0];

    while(i < L1.length && j < L2.length) {
        if (u['doc_id'] < v['doc_id']) {
            i++; u = L1[i];
        }
        else if (u['doc_id'] > v['doc_id']) {
            j++; v = L2[j];
        } else {
            R.push({doc_id: u['doc_id'], rank: u['rank']+ v['rank']});
            i++; j++; u = L1[i]; v = L2[j];
        }
    }

    //Sort descending
    return R;
}

merge = (L1, L2) => {
    concat = L1.concat(L2);
    return merged = concat.reduce((accumulator, cur) => {
        let phrase = cur['keyphrase'];
        let found = accumulator.find(elem => elem['keyphrase'] === phrase)
        if (found) found['score'] = found['score']; //Do not sum up !!
        else accumulator.push(cur);
        return accumulator;
      }, []);
}

getNormalizationFactors = (data) => {
    norm_factors = []
    max = [0, 0, 0]
    n_stems = data.length;
    data.forEach(stem => {
        max = [0, 0, 0]
        stem['doc_ids'].forEach(doc => {
            if(max[0] < doc['count']['title']) max[0] = doc['count']['title']
            if(max[1] < doc['count']['abstract']) max[1] = doc['count']['abstract']
            if(max[2] < doc['count']['body_text']) max[2] = doc['count']['body_text']
        });
        
        max = [max[0] * n_stems, max[1] * n_stems, max[2] * n_stems]
        norm_factors.push(max);
    });

    return norm_factors;
}


get_rank_score = (count_obj, norm_factors) => {
    return (rank_weights[0] * count_obj['title']/norm_factors[0] +
            rank_weights[1] * count_obj['abstract']/norm_factors[1] + 
            rank_weights[2] * count_obj['body_text']/norm_factors[2]);
}

ranking = (data) => {
    norm_factors = getNormalizationFactors(data);
    return data.map((stem, i) => {
        return stem['doc_ids'].map(doc => {
            return {doc_id: doc['doc_id'], rank: get_rank_score(doc['count'], norm_factors[i])}
        });
    });
}

intersect = (data) => {
    ranked = ranking(data)

    //TODO: Shold be done automatically on database level !!
    sort_doc_id = ranked.map(list => {
        return list.sort((a, b) => a['doc_id'] - b['doc_id'])
    });

    var intersected = sort_doc_id[0];
    for (var i = 0; i < ranked.length-1; i++) {
        intersected = mergeIntersect(intersected, sort_doc_id[i+1]);
    }
   
    return intersected;
}

mergeAndSelectFirstN = (data, n=10) => {
    var merged = data[0]['keyphrases']

    for(var i = 0; i < data.length - 1; i++) {
        merged = merge(merged, data[i+1]['keyphrases'])
    }

    merged_sorted = merged.sort((a, b) => {return b['score'] - a['score']}); //Sort descending
    return merged_sorted.slice(0, n);
}

processDocumentQueryResult = (data) => {
    data = (data.length === 0) ? data : intersect(data);
    const data_sorted = data.sort((a, b) => {return b['rank'] - a['rank']}); //Sort descending
    const doc_ids = data_sorted.map(x => x['doc_id']);
    const keyphrase_query = {_id: {$in: [...doc_ids.slice(0, Math.min(10, doc_ids.length))]}};
    return {doc_ids: doc_ids, keyphrase_query: keyphrase_query};
}

processKeyphraseQueryResult = (data) => {
    var keyphrases = (data.length == 0) ? data : mergeAndSelectFirstN(data, n=10);
    return keyphrases.map(x => x['keyphrase']);
}

getQeryFromTerm = (searchTerm) => {
    natural.PorterStemmer.attach();
    stemmedTokens = searchTerm.tokenizeAndStem()
    return {_id: {$in: [...stemmedTokens]}};
}

getKeyphrasesFromMongodb = (query, dbo) => {
    var promise = new Promise((resolve, reject) => {
        dbo.collection('keyphrase_index').find(query).toArray((err, data) => {
            if(err) throw err;
            const keyphrases = processKeyphraseQueryResult(data)
            resolve(keyphrases)
        });  
    })

    return promise;
}

getDocumentIdsFromMongodb = (query, dbo) => {
    var promise = new Promise((resolve, reject) => {
        dbo.collection('inverted_index').find(query).toArray((err, data) => {
            const result = processDocumentQueryResult(data);
            resolve(result);
        });
    })

    return promise;
}

getDataFromCache = async(query, client) => {
    var promise = new Promise((resolve, reject) => {
        const redisQuery = query._id.$in.join('_');
        client.get(redisQuery, (err, data) => {
            if (err) throw err;
            if(data) {
                const result = JSON.parse(data);
                console.log('Loaded from cache');
                resolve(result)
            } else {
                console.log('Query is not cached in database');
                resolve({doc_ids: undefined, keyphrases: undefined})
            }
        });
    });

    return promise;
}

getDocumentsFromMongodb = (doc_ids) => {
    var promise = new Promise((resolve, reject) => {
        client.connect(dbUri, {useUnifiedTopology: true, useNewUrlParser: true}, (err, db) => {
            if (err) throw err;
            const dbo = db.db('covid_19');
            const query = {_id: {$in: [...doc_ids]}};

            dbo.collection('document_index').find(query).toArray((err, data) => {
                if (err) throw err;
                resolve(data)
            });
        }); 
    });
    
    return promise;
}

addDataToCache = (query, doc_ids, keyphrases, client) => {
    var promise = new Promise((resolve, reject) => {
        const redisQuery = query._id.$in.join('_');
        const data_obj = { doc_ids: doc_ids, keyphrases: keyphrases };
        const data_obj_str = JSON.stringify(data_obj);
        client.set(redisQuery, data_obj_str, (err) => {
            if (err) throw err;
            resolve(true);
        });
    });

    return promise;
}

createQuery = (stemmedTokens) => {
    return {_id: {$in: [...stemmedTokens]}};
}

app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    const page = parseInt(req.query.page);
    const numDocuments = parseInt(req.query.numDocuments);
    const filter = req.query.filter;
    const query = getQeryFromTerm(searchTerm);

    getDataFromCache(query, redis).
    then((x) => { //TODO: Fix naming of results -> avoid collision with app.get -> res
        if(x.doc_ids == undefined || x.keyphrases == undefined) {
            client.connect(dbUri, { useUnifiedTopology: true, useNewUrlParser: true }, (err, db) => {
                if (err) throw err;
                
                const dbo = db.db('covid_19');
                
                //Fetch document ids from database
                getDocumentIdsFromMongodb(query, dbo).
                then((x) => { //TODO: Fix naming of results -> avoid collision with app.get -> res

                    const doc_ids = x.doc_ids;
                    const keyphrasesQuery = x.keyphrase_query;

                    //Fetch keyphrases ids from database
                    getKeyphrasesFromMongodb(keyphrasesQuery, dbo).
                    then((keyphrases) => {

                        addDataToCache(query, doc_ids, keyphrases, redis).
                        then((success) => {
                            if(success == true) {
                                console.log('Added data to cache')
                            }
                        });
                    
                        //Fetch document data from database
                        const pages = Math.ceil(doc_ids.length/numDocuments);
                        const load_doc_ids = doc_ids.slice(page*numDocuments, Math.min((page+1)*numDocuments));

                        getDocumentsFromMongodb(load_doc_ids).
                        then((documents) => {
                            //TODO: Merge code duplicate
                            res.status(200).send({documents: documents, pages: pages, keyphrases: keyphrases});
                        });
                    });
                });
            }); 
        } else {
            //Fetch document data from database
            const doc_ids = x.doc_ids;
            const keyphrases = x.keyphrases;
            const pages = Math.ceil(doc_ids.length/numDocuments);
            const load_doc_ids = doc_ids.slice(page*numDocuments, Math.min((page+1)*numDocuments));

            getDocumentsFromMongodb(load_doc_ids).then((documents) => {
                //TODO: Merge code duplicate
                res.status(200).send({documents: documents, pages: pages, keyphrases: keyphrases});   
            });
        }        
    });
});


getCountries = (doc_ids) => {
    const session = driver.session()
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id in $doc_ids
             WITH d as valid_documents
             MATCH (valid_documents)-[:WRITTEN_BY]->(a:Author)-[:WORKS_FOR]->(i:Institution)
             WHERE i.name <> 'undefined'
             WITH DISTINCT i as valid_institutions
             MATCH (valid_institutions)-[:LOCATED_IN]->(c:Country)
             WHERE c.code <> 'undefined'
             WITH DISTINCT c as distinct_c
             RETURN distinct_c`, {doc_ids: doc_ids})
             .then((res) => {
                items = res.records.map(record => {
                    const raw = record.get('distinct_c').properties;
                    const proc = { 'id': raw['code'], 'name': raw['name'], 'value': Math.random() * (100000 - 1000) + 100000, "color": '#FFFF00'} //, 
                    return proc;
                });   

                resolve(items);
             });
    });

    return promise;
}

getDocumentsByAuthors = (author) => {

}

app.get('/metadata', (req, res) => {
    const searchTerm = req.query.term;
    const query = getQeryFromTerm(searchTerm);
    var doc_ids = undefined;

    getDataFromCache(query, redis).
    then((x) => { //TODO: Fix naming of results -> avoid collision with app.get -> res
        if(x.doc_ids == undefined || x.keyphrases == undefined) {
            getDocumentIdsFromMongodb(query, dbo).
            then((x) => { //TODO: Fix naming of results -> avoid collision with app.get -> res
                doc_ids = x.doc_ids;
                getCountries(doc_ids).
                then(countries => {
                    res.status(200).send({countries: countries}); 
                });
            });
        } 
        else{
            doc_ids = x.doc_ids;
            getCountries(doc_ids).
            then(countries => {
                res.status(200).send({countries: countries}); 
            });
        }
    });    
})

app.get('/', function (req, res) {
    res.sendFile(path.join(basePath, 'frontend', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})