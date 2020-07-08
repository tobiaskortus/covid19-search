# Backend Server

The backend server is one of the main components of the search engine and functions as the information retrieval system. The backend is designed using the Node.js javascript runtime. 
Over the default packages the following packages for addressing the different kind of databases as well as for basic natural language processing tasks.

- natural https://github.com/NaturalNode/natural
- MongoDB Node.JS Driver https://mongodb.github.io/node-mongodb-native/
- Neo4j Javascript Driver https://neo4j.com/developer/javascript/, https://github.com/neo4j/neo4j-javascript-driver
- redis https://github.com/NodeRedis/node-redis

> Note: The required packages are defined in the `package.json` file. Running the command `npm install` should install these requirements automatically without further manual installation.

## API-endpoints

The API of the backend can be devided into the enpoints used for the ad-hoc search and the those used for the metadata analysis. In the following section the available API Enpoints for those tasks are described in a high level (description, function calls, parameters). A detailed view over the fuctionality of the backend is described afterwards.

<p align="center">
  <img width=40% src="../../doc/web_server_backedn_api_endpoints.png">
</p>

### Ad-hoc search


**Description:** returns a subset of valid documents as well as suitable keyphrases based on a given query as well as additional information.

```javascript
app.get('/search', (req, res) => {...}
```

|Request Parameter|Type|Description|
|---|---|---
|`term`|`string`|the search term that should used for the information retrieval task |
|`page`|`int`|the current page (as displayed in frontent) that should be taken as a start point for the documents|
|`numDocs`|`int`|number of documents to be loaded|


|Respond Parameter|Type|Description|
|---|---|---|
|`documents`|`object`|loaded documents (as defined by search term page and number of documents to load)|
|`pages`|`int`|number of possible pages for the specified search query|
|`keyphrases`|`object`|important key phrases that are extracted from the highest scored documents from the current document retrieval|

</br>

### Metadata Analysis

#### Document Metadata

**Description:** returns basic information for a specified document (doc_id) containing the title, abstract, authors and involved institutions.

```javascript
app.get('/document', (req, res) => {...}
```

|Request Parameter|Type|Description|
|---|---|---
|`doc_id`|`int`|The document id of the document that should be loaded from db|


|Respond Parameter|Type|Description|
|---|---|---|
|`document`|`object`|loaded document|

</br>

#### Geographical statistic

**Description:** returns a statistic of the geographical location of institutions involved in a set of given papers (defined by search term).

```javascript
app.get('/geo', (req, res) => {...}
```

|Request Parameter|Type|Description|
|---|---|---
|`term`|`string`|the search term that should be taken into account for the statistic |

|Respond Parameter|Type|Description|
|---|---|---|
|`countries`|`object`|contry statistics containing the country code (used for visualization), the name of the country, the number of documents for each country and a placeholder for the color variable (variable is set in frontend)|

</br>

#### Author/ Institution Statistic

**Description:** returns a statistic of a specific author or institution containing currently the number of documents published.

```javascript
app.get(`/statistics`, (req, res) => {...}
```

|Request Parameter|Type|Description|
|---|---|---|
|`type`|`string`|the type of statistic that sould be processed (either `'author'` or `'institution'`) |
|`params`|`object`|additional parameters that are required in order to fetch the necessary data from the graph database|

</br>

## Information retrieval - Ad-hoc

### Preprocessing of the given search query

The preprocessing of the search query given by the arguments of the /search page takes place in the`getQeryFromTerm` function. In order to transform a given query, which can be either present in keywords or a free text, for the usage in the information retrieval system of the backend server the following three steps are hereby performed:

- **splitting:** The given search query is split into a list of individual strings by whitespaces. 
- **stemming:** the word stem is formed for each of the words from the split set using the [natural](https://github.com/NaturalNode/natural) package.
- **conversion into query:** in a final step the list of search terms are transformed to a valid MQL query which can be processed by the mongodb database.

```javascript
/**
 * @param the given search term present in keywords or a free text 
 * @returns a mongodb query 
 */
getQeryFromTerm = (searchTerm) => {...}
```

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

 Per default 2GB are assigned to the redis database which is in the most cases enough storage to cache all search results performed by the user given the size if the mongodb database and the expected amount of requests performed on such a local search engine. nevertheless, to avoid the cache from crashing if the elements cached should exceed the assigned memory, the maxmemory configuration of the database is set to a least recent out strategy. 

</br>

<p align="center">
  <img width=60% src="../../doc/redis_caching_backend.png">
</p>

**Fig 2:** Processing pipeline for ad-hoc search using the MongoDB data model, the processing logic and an intermediate redis cache in order to improve responsiveness and speed expecially when consecutively loading different pages for the same search query.


#### Document ranking
In order to determine a ranking of the importance of the documents based on a given query a document ranking is performed by the backend in the function `ranking`

```javascript
/**
 * @param documents containing the document id and the count of the term occurence 
 * @returns rank scores for all documents
 */
ranking = (data) => {...}
```


For the ranking process a modified version of the weighted zone scoring [2] is used. In the basic version of the mentioned scoring system. The rank of the document is determined solely by the occurence of the word in a specific zone (e.g. title, abstract, body) of the document <img src="https://render.githubusercontent.com/render/math?math=s_{i} = [0, 1]">  weighted by a set of weights <img src="https://render.githubusercontent.com/render/math?math=g_{i} \in [0, 1]"> with <img src="https://render.githubusercontent.com/render/math?math=\sum_{i=1}^{l}g_{i} = 1">.

<p align="center">
  <img width=10% src="https://render.githubusercontent.com/render/math?math=\sum_{i=1}^{l} g_{i}s_{i}">
</p>

In order to reward documents with a high occurence of the word the scoring function is modified by a nomalized word count factor, where  <img src="https://render.githubusercontent.com/render/math?math=s_{i}"> is defined by the fraction of the number of occurences of the term in the current document devided by the highest occurence of the term in any document.

These normalized occurence factors are calculated using the `getNormalizationFactors` and 
`getRankScore` function.

```javascript
/**
 * @param documents containing the document id and the count of the term occurence 
 * @returns normalization factors for all document zones (title, abstract, body)
 */
getNormalizationFactors(data) => {...}
```

```javascript
/**
 * @param count of the term occurence in the doument zones (title, abstract, body)
 * @returns rank score for the given document
 */
getRankScore(count_obj, norm_factors) => {...}
```

#### Document Intersection

The prevously retrieved lists of document ids containing the matched document ids for on of the word stems that are presented in the search query still require some additional processing in order to return only the document ids that match all word stems. Therefor a list intersection is performed, as displayed in Fig 2, in order to find the mentioned subset of documents.

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


#### Country, Institution and Author Filters 
In order to encolse the search further, the search engine enables the user to filter the documents for additional specific properties. Currently those support filtering for specific Locations, Authors and Institutions. The filtering process is directly integrated into the ad-hoc retrieval and is performed after the retrieval of the matching document ids. In a first step the filters, which are transmitted by the frontend as a http request parameter, are grouped based on their category (country, author, institution) into groups using the `groupFilters` method.

```javascript
/**
 * @param ungrouped filters (array of objects with the properties category and value)
 * @returns a list of grouped filtes (array of objects with the properties category and values)
 */
groupFilters = (arr) => {...}
```

Those grouped filters are then applied to the document ids that are matched to the current search term in parralel based on the filter category using either the function `filterByCountries`, `filterByAuthor` or `filterByInstitution`. Afterward the results are merged using the same intersection technique as previously described in [Document Intersection](), as this technique has proven to be more efficient than applying the filters recursive on the list of document ids. 


```javascript
/**
 * @param matched document ids
 * @param list of grouped filters
 * @returns filtered list of document ids
 */
filter = (doc_ids, grouped_filters) => {...}
```


```javascript
/**
 * @param matched document ids
 * @param list of filter elements (either countries, authors or institutions)
 * @returns filtered list of document ids (by single category)
 */
filterByCountries = (doc_ids, countries) => {...}
filterByAuthor = (doc_ids, authors) => {...}
filterByInstitution = (doc_ids, institutions) => {...}
```

## Information retrieval - metadata

The following sections describes the basic functionality of the metadata analysis for information retrieval in order to gain additional insights (on top of the ad-hoc) on the research topic.
The current state of the matadata analysis can be devided into two main topics which are designed to provide additional information each on the geographical statistics of the publications for a given ad-hoc search request and on the overall statistics of the dataset regardin to the publications of different authors and institutions.

### Geographical Statistics

In order to retrieve the statistic of the geographical location of institutions involved in a set of given papers, defined by a previous ad-hoc search request. The initial preprocessing is in its structure in most parts is similar to the previously described ad-hoc search. Basis of the whole process is the search term that is given by the request parameter (as described in the section [Data retrieval from database]()). In most cases the intersected document ids are loaded from the cache. If the data is not represented in the cache the data is loaded in a similar manner as described in the previously mentioned section. The main difference is that the document ranking is skipped due to the performance impact of the ranking process, which has no impact on the following retrieval of the geographical statistics.

The processed document ids are then taken into account in order to get the statistics of geographical location of institutions using the `getCountries` function that performs a search query on the Neo4j metadata property graph which is described in detail in the documentation  [document processing + construction of data models (CORD-19)]().

```javascript
/**
 * @param document ids as retrieved from the ad-hoc search
 * @returns a list of represented countries with additional information 
 *          (name, ISO3166 alpha-2 country code, number of publications)
 */
getCountries = (doc_ids) => {...}
```


### Author/ Institution Statistics

In order to get some additional information about the relevance of specific authors and institutions in the field of COVID-19 the metadata graph database can be queried for additional statistics (currently limited to the number of publications) The type of statistic that should be fetched from the database is defined by the `type` property in the http request. Based on this property the corresponding function, either `getAuthorsStatistics` or `getInstitutionStatistics`, is called. In those functions the required data is loaded from the Neo4j graph database and afterwards returned to the frontend via the http response.

```javascript
/**
 * @params names of authors represented in paper
 * @returns authors with corresponding number of publications found in the CORD-19 dataset
 */
getAuthorStatistics = (authors) => {...}
```

```javascript
/**
 * @params names of institutions represented in paper
 * @returns institutions with corresponding number of publications found in the CORD-19 dataset
 */
getInstitutionStatistics = (institutions) => {...}
```

## References

[1] Sunghwan Kim, Taesung Lee, Seung Won Hwang, andSameh Elnikety. List intersection for web search: Algo-rithms, cost models, and optimizations.Proceedings ofthe VLDB Endowment, 12(1):1–13, 2018.

[2] Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze. 2008. Introduction to Information Retrieval. Cambridge University Press, USA.