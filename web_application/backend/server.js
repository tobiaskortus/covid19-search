const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const client = require('mongodb').MongoClient;

const app = express();
const port = process.env.PORT || 3000;

const basePath = path.resolve(__dirname, '..');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(basePath, 'frontend', 'build')));

const dbUri = 'mongodb://localhost:27017/';

app.get('/api/version', (req, res) => {
    console.log('request for /api/version')
    res.send({express: 'v1.0 - alpha'});
});

//TODO: manage search queries
app.get('/search', (req, res) => {

});

app.get('/document', (req, res) => {
    const doc_id = parseInt(req.query.doc_id);

    client.connect(dbUri, {useUnifiedTopology: true, useNewUrlParser: true}, (err, db) => {
        if (err) throw err;
        const dbo = db.db('covid_19');
        const query = {_id: doc_id};

        dbo.collection('document_index').findOne(query).then((doc) => {
            console.log(doc);
            res.status(200).send(doc);
        });
    }); 
});

app.get('/', function (req, res) {
    res.sendFile(path.join(basePath, 'frontend', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})