# Processing

This directory includes all relevant scripts for processing the CORD-19 data for using them in the search engine. Before performing the processing the required prerequesites from the main README should be installed and configured.

### Getting the dataset

- Download the dataset from one of the following sources:
    - https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge
    - https://www.semanticscholar.org/cord19

- Extract data to /dataset directory (create the directory if not existent). The file structure should be the following after the previous steps:

```
dataset

└───arxiv
|      ######.json
|      ######.json
|      ...
|
└───biorxiv_medrxiv
|      ######.json
|      ######.json
|      ...
|
└───biorxiv_medrxiv
|      ######.json
|      ######.json
|      ...
|
└───cord_19_embeddings_4_24
|      cord_19_embeddings_4_24.csv
|
└───custom_license
|      ######.json
|      ######.json
|      ...
|
└───noncomm_use_subset
|
| COVID.DATA.LIC.AGMT.pdf
| json_schema.txt
| metadata.csv
| metadata.readme
```


### Text Preprocessing

the following steps are performed in order to improve the quality of the queryable phrases:

- **Transforming all characters to lowercase:**
- **removing citations:**
- **remove all content in brackets:**
- **tokenize:**
- **remove symbols and single characters:**
- **lemmatize tokens**:

![img](../doc/reverse_index_document_preprocessing.png)

## References:
[1] Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze. 2008. Introduction to Information Retrieval. Cambridge University Press, USA.