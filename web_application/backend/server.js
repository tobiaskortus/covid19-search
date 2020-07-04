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
const redis = RedisClient(27018, 'localhost'); //redis-server --maxmemory 2GB --maxmemory-policy allkeys-lru --port 27018
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

    if(L1[0]['doc_id'] === undefined) { //intersect plain array
        while(i < L1.length && j < L2.length) {
            if (u < v) {
                i++; u = L1[i];
            }
            else if (u > v) {
                j++; v = L2[j];
            } else {
                R.push(u);
                i++; j++; u = L1[i]; v = L2[j];
            }
        }
    } else { //Intersect data structure
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
    }

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

getDataFromCache = (query, client) => {
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


getDocumentsByAuthor = (author) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (a:Author)-[:WROTE]->(d:Document)
             WHERE a.name = $author and d.doc_id <> -1
             return d.doc_id`, {author: author})
             .then((res => {
                documents = res.records.map(record => {
                    return record.get('d').properties;
                });   

                resolve(documents);
                session.close();
             }));
    });
    
    return promise;
}

getDocumentsByInstitution = (institution) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (i:Institution)-[:EMPLOYED]->(a:Author)-[:WROTE]->(d:Document)
             WHERE i.name = $institution and d.doc_id <> -1
             return d.doc_id`, {institution: institution})
            .then(res => {
            documents = res.records.map(record => {
                return record.get('d').properties;
            });   

            resolve(documents);
            session.close();
        }); 
    });

    return promise;
}

getDocumentMetadata = (doc_id) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id = $doc_id
             MATCH (d)-[:WRITTEN_BY]->(a:Author)
             WHERE a.name <> 'undefined'
             WITH DISTINCT a as da, d as d
             MATCH (da)-[:WORKS_FOR]->(i:Institution)
             WITH i as i, da as da, d as d
             return da.name as author, i.name as institution`, {doc_id: doc_id})
            .then(res => {
            author_institution_tuples = res.records.map(record => {
                return {
                    'author': record.get('author'),
                    'institution': record.get('institution')
                };
            });   

            resolve(author_institution_tuples);
            session.close();
        }) 
    });

    return promise;
}


getCountries = (doc_ids) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id in $doc_ids
             WITH d as vd
             MATCH (vd)-[:WRITTEN_BY]->(a:Author)-[:WORKS_FOR]->(i:Institution)
             WHERE i.name <> 'undefined'
             WITH DISTINCT i as vi
             MATCH (vi)-[:LOCATED_IN]->(c:Country)
             WHERE c.code <> 'undefined'
             RETURN c.name as name, c.code as code, count(c.name) as count`, {doc_ids: doc_ids})
             .then((res) => {
                countries = res.records.map(record => {
                    return { 
                        'id': record.get('code'), 
                        'name': record.get('name'), 
                        'value': record.get('count').low, 
                        'color': '#FFFF00'} //, 
                });   

                resolve(countries);
                session.close();
             });
    });

    return promise;
}

getAuthorStatistics = (authors) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (a:Author)
             WHERE a.name in $authors
             WITH a as va
             MATCH (va)-[:WROTE]->(d:Document)
             WHERE d.doc_id <> -1
             RETURN va.name as name, collect(d.doc_id) as doc_ids, count(d) as count`, {authors: authors})
            .then((res) => {
                statistic = res.records.map(record => {
                    return {
                        'name': record.get('name'),
                        'doc_ids': record.get('doc_ids'),
                        'count': record.get('count').low
                    }
                });

                resolve(statistic);
                session.close();
            });
    });

    return promise;
}


getInstitutionStatistics = (institutions) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        session.run(
            `MATCH (i:Institution)
                WHERE i.name in $institutions and i.name <> 'undefined'
                WITH i as vi
                MATCH (vi)-[:EMPLOYED]->(a:Author)-[:WROTE]->(d:Document)
                WHERE d.doc_id <> -1
                RETURn vi.name as name, collect(d.doc_id) as doc_ids, count(d) as count`, {institutions: institutions})
            .then((res) => {
                statistic = res.records.map(record => {
                    return {
                        'name': record.get('name'),
                        'doc_ids': record.get('doc_ids'),
                        'count': record.get('count').low
                    }
                });

                resolve(statistic);
                session.close();
            });
    });

    return promise;
}

filterByCountries = (doc_ids, countries) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        // Return all results if no country filter was defined

        if (countries === undefined) {
            resolve(doc_ids);
            return promise;
        }

        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id in $doc_ids
             WITH d as vd
             MATCH (vd)-[:WRITTEN_BY]->(a:Author)-[:WORKS_FOR]->(i:Institution)-[:LOCATED_IN]->(c:Country)
             WHERE c.name in $countries
             RETURN DISTINCT vd.doc_id as doc_id`, {doc_ids: doc_ids, countries: countries})
            .then((res) => {
                filtered = res.records.map(record => {
                    return record.get('doc_id').low
                });

                resolve(filtered);
                session.close();
            });
    });

    return promise;
}

filterByAuthor = (doc_ids, authors) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        // Return all results if no country filter was defined

        if (authors === undefined) {
            resolve(doc_ids);
            return promise;
        }

        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id in $doc_ids
             WITH d as vd
             MATCH (vd)-[:WRITTEN_BY]->(a:Author)
             WHERE a.name in $authors
             RETURN DISTINCT vd.doc_id as doc_id`, {doc_ids: doc_ids, authors: authors})
            .then((res) => {
                filtered = res.records.map(record => {
                    return record.get('doc_id').low
                });

                resolve(filtered);
                session.close();
            });
    });

    return promise;
}

filterByInstitution = (doc_ids, institutions) => {
    const session = driver.session();
    var promise = new Promise((resolve, reject) => {
        // Return all results if no country filter was defined

        if (institutions === undefined) {
            resolve(doc_ids);
            return promise;
        }

        session.run(
            `MATCH (d:Document)
             WHERE d.doc_id in $doc_ids
             WITH d as vd
             MATCH (vd)-[:WRITTEN_BY]->(a:Author)-[:WORKS_FOR]->(i:Institution)
             WHERE i.name in $institutions
             RETURN DISTINCT vd.doc_id as doc_id`, {doc_ids: doc_ids, institutions: institutions})
            .then((res) => {
                filtered = res.records.map(record => {
                    return record.get('doc_id').low
                });

                resolve(filtered);
                session.close();
            });
    });

    return promise;
}

filter = (doc_ids, grouped_filters) => {
    var promise = new Promise((resolve, reject) => {
        if (grouped_filters === undefined ||Object.keys(grouped_filters).length === 0) {
            resolve(doc_ids);
        } else {
            run_filters = []

            if(grouped_filters['country'] != undefined) {
                run_filters.push(filterByCountries(doc_ids, grouped_filters['country']))
            }

            if(grouped_filters['author'] != undefined) {
                run_filters.push(filterByAuthor(doc_ids, grouped_filters['author']))
            }

            if(grouped_filters['institution'] != undefined) {
                run_filters.push(filterByInstitution(doc_ids, grouped_filters['institution']))
            }

            Promise.all(run_filters).then((filtered_doc_ids) => {
                var intersected = filtered_doc_ids[0];
                for (var i = 0; i < filtered_doc_ids.length-1; i++) {
                    intersected = mergeIntersect(intersected, filtered_doc_ids[i+1]);
                }
                resolve(intersected)
            }); 
        }
    });

    return promise;
}

function groupFilters(arr) {
    if (arr === undefined) {
        return [];
    }

    var dict = {}

    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        var exists = dict[item.category] != undefined

        dict[item.category] = (!exists) 
            ? [item.value] 
            : [...dict[item.category], item.value];
    }

    return dict;
}


app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    const query = getQeryFromTerm(searchTerm);

    const page = parseInt(req.query.page);
    const numDocuments = parseInt(req.query.numDocuments);
    const filters = JSON.parse(req.query.filters);
    const filters_grouped = groupFilters(filters);
    
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

                    filter(doc_ids, filters_grouped).
                    then((doc_ids) => {
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
            }); 
        } else {
            //Fetch document data from database
            const doc_ids = x.doc_ids;
            const keyphrases = x.keyphrases;
            
            filter(doc_ids, filters_grouped).
            then(doc_ids => {

                const load_doc_ids = doc_ids.slice(page*numDocuments, Math.min((page+1)*numDocuments));
                const pages = Math.ceil(doc_ids.length/numDocuments);

                getDocumentsFromMongodb(load_doc_ids).then((documents) => {
                    //TODO: Merge code duplicate
                    res.status(200).send({documents: documents, pages: pages, keyphrases: keyphrases});   
                });
            })
        }        
    });
});

app.get('/document', (req, res) => {
    const doc_id = parseInt(req.query.doc_id);
    getDocumentsFromMongodb([doc_id])
    .then(document => {
        const merged = {
            'doc_id': document[0]._id,
            'title': document[0].document_title,
            'abstract': document[0].abstract,
            'authors': document[0].authors
        };
        res.status(200).send(merged);
    });
});

app.get('/geo', (req, res) => {
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

app.get(`/statistics`, (req, res) => {
    const params = req.query.params.split(',');
    const type = req.query.type


    switch(type) {
        case 'authors':
            getAuthorStatistics(params).
            then(statistics => {
                res.status(200).send({metadata: statistics});
            });
            break;
        case 'institutions':
            getInstitutionStatistics(params).
            then(statistics => {
                res.status(200).send({metadata: statistics});
            })
            break;
    }
});

app.get('/', function (req, res) {
    res.sendFile(path.join(basePath, 'frontend', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})