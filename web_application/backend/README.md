# Backend Server

## API-endpoints

## Ad-hoc search

Api Endpoints

```javascript
app.get('/search', (req, res) => {...}
```

This requests expects, as dispicted below, a search term as string, the selected page and the number of documents displayed per page. For exact encoding of the url-parameters please refer to the documention of the [web-application frontend]().

```json
{
    'term': ...,
    'page': ...,
    'numDocuments': ...
}
```

### Preprocessing of the given search query

### Data retrieval from database

Redis Caching

<p align="center">
  <img width=80% src="../../doc/redis_caching_backend.png">
</p>

**Fig 2:** f

#### Intersection of Results

<p align="center">
  <img width=40% src="../../doc/intersect.png">
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

## References

[1] Sunghwan Kim, Taesung Lee, Seung Won Hwang, andSameh Elnikety. List intersection for web search: Algo-rithms, cost models, and optimizations.Proceedings ofthe VLDB Endowment, 12(1):1–13, 2018.