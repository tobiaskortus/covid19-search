# Processing

This readme file describes the perocessing of the CORD-19 dataset in order to provide a suitable set of data models for the information retrieval task. This directory includes all relevant scripts for processing the CORD-19 data for using them in the search engine. Before performing the processing the [required prerequesites](../README.md) should be installed and configured.

The processing of the given dataset, in order to create the data models for the search engine, consists of two two parts. First the given documents which are given in a json format are preprocessed in order to extract the relevant information and perform additional data cleaning and a vertical data migration from diferent sources. After that the processed data is used in order to create the required datamodels that are used for the information retrieval task (document index, inverted index, metadata property graph).

The preprocessing step can be divided into three components. The extraction and processing of the authors and institutions, the preprocessing of the document text, containing the title, abstract and body and the processing of the references of the cited papers. 

> Note: The processing of the references is currently not used due to the poor performance.

</br>

<p align="center">
  <img width=55% src="../doc/processing_overview.png">
</p>

**Fig 1:** Schematic visualization of the processing steps performed as well as the usage of additional datasources in order to create the data models.

</br>

## Inverted Index and Document Index Construction

The processing and creation of the inverted index and document index data model is performed in the `document-index-construction-mongodb.ipynb` notebook using additional utility functions from `literature.py`, `preprocessing.py`, `grid.py` and `metadata.py`.


### Authors/ Insitutions Processing
The raw information on the involved authors and institutions are extracted from the json file using the functionality implemented in the `DataLoader` class in `literature.py`. The raw information is further processed by multiple tasks which can be selected based on the desired data policy (keep all data, remove invalid data).

The authors which are each represented as a own object containing a first name, a list of middle names (can be empty) and a last name. For the processing of the authors, which is performed in the `__parse_author` function, the following steps can be enabled:

- **clean names (`__clean_name_part`):** removes all characters that are not valid in names (ISO basic Latin alphabet and '-' character)
- **join + normalize names (`__join_name`):** combines the single components of the name into a single string and shortens the first and middle names to the following form if `normalize_names` is set to true: e.g. Stephen William Hawking &rightarrow; S. W. Hawking. This normalization can be used in order to match authors from the documents reference list.
- **plausibility check (`__is_name`):** basic check whether the given name is plausible. The given name is invalid if the length of the last name is shorter than two characers, the first name does not contain any valid character or fist name is empty or whitespace.

The extracted institution can be also further processed using the `__parse_institution` function either to check the plausibility of an insitution or to expand the data by the geographical location of the institution. The matching of the institutions both for the plausibility check and the location lookup the Global Research Identifier Database [2] and a list of ISO 3166-1 Codes [3] is used (please refer to the References section for additional credits on the used datasets).







### Document Preprocessing

In order to provide a sufficient data model for the boolean information retrieval model several preprocessing steps are performend in order to minimize the required space and optimize the rate of matched documents by improving the quality of the queryable phrases.
Therefore a number of various steps are performed on each section of the document (title, abstract body). The sections are each extracted from the json document using the functionality implemented in the `DataLoader` class in `literature.py`. The following preprocessing tasks were implemented as a pipeline (`preprocessing.py`) where the class `NLPPipeline` is used as a base processing block. For this block, additional modules that define an arbitrary type of processing step for the abstract `transform` function of the base class `NLPTrasformer`, can be registered.

- Transforming all characters to lowercase: `ToLowercase`
- Removing citations `CitationRemover`
- Remove all content in brackets `ContentInBracketsRemover`
- Tokenization `Tokenizer`
- Remove stopwords `StopwordRemover`
- Removal of symbols and single characters `SymbolRemover`, `NonAlphanumericRemover`
- Stemming `Stemmer`

After that a list of stopwords that exist in the given text is returned. In order to improve the performance of the following creation of the inverted index, duplicate word stems are grouped using the `collections.Counter` datatype which can be used for counting hashable objects.

### Data Model

#### Inverted Index

For each document in the CORD-19 dataset a unique id is assigned. This id is used in order to identify the corresponding document in the document index (as described below).  

```json
{
    _id: 2, 
    document_title: "Global Analysis of...",
    authors: [
        {
            author: "D. Bichara",
            institution: "undefined"
        }
    ],
    abstract:"We formulate a multi-group...",
}
```

#### Document Index

```json
{
    _id: "percentu",
    doc_ids: [
        {
            doc_id: 1290, 
            count: 
            {
                title: 0,
                abstract: 0,
                body_text: 2
            }
        },
        {
            doc_id: 44416, 
            count: 
            {
                title: 0,
                abstract: 2,
                body_text: 0
            }
        },
    ]
}
```

### Model Creation

In order to minimize the runtime of the document and inverted index construction the data is processed in parrallel. Therefore the CORD-19 files are divided into chunks with a default size of 128 using the `create_chunks` function and are processed in a parrallel manner using pythons `multiprocessing` library on the `process_chunk` function.

```python
"""
@param: a list of all files
@param: the desired size of a chunk (per default 128)
@returns: a list of chunks: list of tuples [(file path, document id), ...]
"""
def create_chunks(files, chunk_size=128)
```

```python
"""
@param: chunk of documents: tuple (file path, document id)
@param: 
@param:
"""
def process_chunk(args, update_doc_idx=True, update_inv_indx=True)
```

In the `process_chunk` function

#### Redis Cache

The default algorithm for creating the inverted index 

<p align="center">
  <img width=50% src="laufzeit-mongo.png">
</p>

**Fig 2:** analyisis of the different database operations that are required in order to create the inverted index database model.

</br>

Since the connection to the database is only established once for each processed chunk and is therefore performed significantly less frequently than the other operations, the runtime is not a problem here.

However, the read access, which is carried out several times for each document, can be identified as a relevant bottleneck. In order to minimize the time required for a read access, an additional Redis cache is used, in which the most frequently used word stems and document IDs are managed.Through this measure the runtime of the inverted index construction can be improved significantly.


## Metadata Property Graph

### Data Model

<p align="center">
  <img width=40% src="../doc/property_graph.png">
</p>



## References:
[1] Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze. 2008. Introduction to Information Retrieval. Cambridge University Press, USA.

[2] [ISO 3166-1 List](https://datahub.io/core/country-list): licensed under a  [Open Data Commons Public Domain Dedication and License v1.0](https://opendatacommons.org/licenses/pddl/index.html)

[3] [Global Research Identifier Database](https://www.grid.ac/): licensed under a
 [Creative Commons Public Domain 1.0 International licence](https://creativecommons.org/publicdomain/zero/1.0/)