const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const client = require('mongodb').MongoClient;
const natural = require('natural')

const app = express();
const port = process.env.PORT || 3000;

const basePath = path.resolve(__dirname, '..');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(basePath, 'frontend', 'build')));

const dbUri = 'mongodb://localhost:27017/';

intersect = (data) => {
    cleaned_data = data.map(stem => stem['doc_ids'].map(document => document.doc_id))
    intersection = cleaned_data.reduce((a, b) => a.filter(c => b.includes(c)));
    return intersection;
}

app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    natural.PorterStemmer.attach();
    const stemmed_tokens = searchTerm.tokenizeAndStem()

    client.connect(dbUri, {useUnifiedTopology: true, useNewUrlParser: true}, (err, db) => {
        if (err) throw err;
        const dbo = db.db('covid_19');
        const query = {_id: {$in: [...stemmed_tokens]}};

        dbo.collection('reversed_index').find(query).toArray((err, data) => {
            if (err) throw err;
            data = (data.length === 0) ? data : intersect(data)
            console.log(`Found ${data.length} entries for query ${searchTerm}`);
            res.status(200).send(data);
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