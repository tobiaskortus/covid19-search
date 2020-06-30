# Backend Server

## API-endpoints

<p align="center">
  <img width=40% src="../../doc/web_server_backedn_api_endpoints.png">
</p>

### Ad-hoc search

```javascript
app.get('/search', (req, res) => {...}
```

This requests expects, as dispicted below, a search term as string, the selected page and the number of documents displayed per page. For exact encoding of the url-parameters please refer to the documention of the [web-application frontend]().

```json
{
  term: ...,
  page: ...,
  numDocuments: ...
}
```


### Metadata analysis

```javascript
app.get('/document', (req, res) => {...}
```

```json
{
    doc_id: ...
}
```

```javascript
app.get('/metadata', (req, res) => {...}
```

```json
{
  term: ...
}
```

```javascript
app.get(`/statistics`, (req, res) => {...}
```

```json
{
  type: ...
  params: [
    ...,
    ...
  ]
}
```


## Information retrieval - Ad-hoc

### Preprocessing of the given search query

The preprocessing of the search query given by the arguments of the /search page takes place in the`getQeryFromTerm` function.

```javascript
/**
 * @param the given search term present in keywords or a free text 
 * @returns a mongodb query 
 */
getQeryFromTerm = (searchTerm) => {...}
```

In order to transform a given query, which can be either present in keywords or a free text, for the usage in the information retrieval system of the backend server the following two steps are performed:

- **splitting:** The given search query is split into a list of individual strings by whitespaces. 
- **stemming:** the word stem is formed for each of the words from the split set using the [natural](https://github.com/NaturalNode/natural) package.
- **conversion in query:** in a final step the list of search terms are transformed to a valid query which can be processed by mongodb

### Data retrieval from database

The previously constructed query is used in the following step using the function  `getDocumentIdsFromMongodb` in order to return a list of document ids, with the additional information as described in the documentation of the [data model](), with size <img src="https://render.githubusercontent.com/render/math?math=n"> where <img src="https://render.githubusercontent.com/render/math?math=n"> corresponds to the number of word stems in the query. 


```javascript
/**
 * @param search query as given by getQeryFromTerm
 * @param the connection object to the mongodb database
 * @returns all matched document ids
 */
getDocumentIdsFromMongodb = (query, dbo) => {...}
```

These results are then consecutively ranked and the lists are intersected in order to return the matching documents that match all elements of the query. In a final step the documents based on on the page and number of documents per pages as defined in the request arguments are loaded from the database using the `getDocumentsFromMongodb` function and returned as the http response.

```javascript
/**
 * @param 
 * @returns
 */
getDocumentsFromMongodb = (doc_ids) => {...}
```

In order to improve the performance of these operations, expecially when loading different pages for the same search query, a additional in memory cache is implemented using a redis database. Hereby the processed result of search queries are stored in the redis cache using the `getDataFromCache` function in order to seed up future requests which can be fetched using `getDataFromCache`. 


```javascript
/**
 * @param
 * @param
 * @returns
 */
getDataFromCache = (query, client) => {...}
```

```javascript
addDataToCache = (query, doc_ids, keyphrases, client) => {...}
```

 Per default 2GB are assigned to the redis database which is in the most cases enough storage to cache all search results performed by the user given the size if the mongodb database and the expected amount of requests performed on such a local search engine. Anyway the maxmemory configuration of the database is set to a least recent out strategy. 

</br>

<p align="center">
  <img width=60% src="../../doc/redis_caching_backend.png">
</p>

**Fig 2:** Processing pipeline for ad-hoc search using the MongoDB data model, the processing logic and an intermediate redis cache in order to improve responsiveness and speed expecially when consecutively loading different pages for the same search query.


#### Document ranking

#### Document intersection

<p align="center">
  <img width=25% src="../../doc/intersect.png">
</p>

**Fig 2:** Symbolic representation of three sets of document results based on a search query <img src="https://render.githubusercontent.com/render/math?math=M_{A}">, <img src="https://render.githubusercontent.com/render/math?math=M_{B}"> and <img src="https://render.githubusercontent.com/render/math?math=M_{C}"> determined on the basis of the components <img src="https://render.githubusercontent.com/render/math?math=A">, <img src="https://render.githubusercontent.com/render/math?math=B"> und <img src="https://render.githubusercontent.com/render/math?math=C"> of  a search query <img src="https://render.githubusercontent.com/render/math?math=B"> und <img src="https://render.githubusercontent.com/render/math?math=A B C">, as well as their final search result consisting of the intersection <img src="https://render.githubusercontent.com/render/math?math=B"> und <img src="https://render.githubusercontent.com/render/math?math=M_{A,B,C} = M_{A} \cap M_{B} \cap M_{C}">

</br>

With regards to the memory and runtime requirements it is recommended to perform these operations on the database level instead of the application level. Nevertheless in this project the mentioned operations were moved to the application layer in order to make adjustments regarding the document ranking and implementation of different IR algorithms as dynamic as possible. Due to the small size of the data set, no significant restrictions in speed and memory consumtion are expected.

The intersection of the search results are computated based on <img src="https://render.githubusercontent.com/render/math?math=n-1"> iterations of the 2-way-merge algorithm using <img src="https://render.githubusercontent.com/render/math?math=n"> lists of ranked documents loaded from the database based on the search stems as described before <cite>[1]</cite>. This operation is performed in the function `intersect` in `server.js` . The actual implementation of the 2-way-merge algorihm is located in the `mergeIntersect` method which is also located in `server.js` 


```javascript
/**
 * @param data nested list of documents identified by information retrieval
 * @returns ranked list of intersected documents identified by boolean IR
 */
intersect = (data) => {...}
```


```javascript
/**
 * @param L1 first list to intersect
 * @param L2 second list to intersect
 * @returns list of intersected items
 */
mergeIntersect = (L1, L2) => {...}
```

## Information retrieval - metadata

## References

[1] Sunghwan Kim, Taesung Lee, Seung Won Hwang, andSameh Elnikety. List intersection for web search: Algo-rithms, cost models, and optimizations.Proceedings ofthe VLDB Endowment, 12(1):1–13, 2018.