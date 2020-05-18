const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const client = require('mongodb').MongoClient;
const natural = require('natural')

const app = express();
const port = process.env.PORT || 3000;

const basePath = path.resolve(__dirname, '..');

const rank_weights = [0.55, 0.25, 0.2]

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(basePath, 'frontend', 'build')));

const dbUri = 'mongodb://localhost:27017/';

mergeIntersect = (L1, L2) => {
    R = []
    var i = 0;
    var j = 0;
    var u = L1[0];
    var v = L2[0];

    while(i < L1.length && j < L2.length) {
        if (u['doc_id'] < v['doc_id']) {
            i++;
            u = L1[i];
        }
        else if (u['doc_id'] > v['doc_id']) {
            j++;
            v = L2[j];
        } else {
            R.push({doc_id: u['doc_id'], rank: u['rank']+ v['rank']});
            i++; j++;
            u = L1[i]; v = L2[j];
        }
    }

    //Sort descending
    return R;
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

app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    natural.PorterStemmer.attach();
    const stemmed_tokens = searchTerm.tokenizeAndStem()
    console.log(stemmed_tokens)

    client.connect(dbUri, {useUnifiedTopology: true, useNewUrlParser: true}, (err, db) => {
        if (err) throw err;
        const dbo = db.db('covid_19');
        const query = {_id: {$in: [...stemmed_tokens]}};

        dbo.collection('inverted_index').find(query).toArray((err, data) => {
            if (err) throw err;
            data = (data.length === 0) ? data : intersect(data)
            data_sorted = data.sort((a, b) => {return b['rank'] - a['rank']}); //Sort descending
            data_sorted_reduced = data_sorted.map(x => x['doc_id']);
            console.log(`Found ${data_sorted_reduced.length} entries for query ${searchTerm}`);
            res.status(200).send(data_sorted_reduced);
        });
    }); 
});

app.get('/document', (req, res) => {
    const doc_id_str = req.query.doc_id;
    const doc_ids = doc_id_str.split(",").map(Number)

    console.log(`Loaded ${doc_ids.length} documents from mongodb`);

    client.connect(dbUri, {useUnifiedTopology: true, useNewUrlParser: true}, (err, db) => {
        if (err) throw err;
        const dbo = db.db('covid_19');
        const query = {_id: {$in: [...doc_ids]}};

        dbo.collection('document_index').find(query).toArray((err, data) => {
             if (err) throw err;
            res.status(200).send(data);
        });
    }); 
});

app.get('/', function (req, res) {
    res.sendFile(path.join(basePath, 'frontend', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})