![img](doc/header.png)

[![Generic badge](https://img.shields.io/badge/Made_with-Python-GREEN.svg)](https://shields.io/)
[![Generic badge](https://img.shields.io/badge/Made_with-Node.js-GREEN.svg)](https://shields.io/)
[![Generic badge](https://img.shields.io/badge/Made_with-React.js-GREEN.svg)](https://shields.io/)
[![Generic badge](https://img.shields.io/badge/Stable-No_release-BLUE.svg)](https://shields.io/)

<p align="center">
  <img src="doc/search.gif">
</p>

## Description
The opening literature research is a fundamental part of scientific work which takes often a substential ammount of time.  This problem is  further reinforced by the continuously increasing volume of scientific publications [1]. The goal of this work is the development of the basis for an intelligent search engine with the aim of supporting scientific literature research on the topic of COVID-19, providing the user additional information on the topic and the surroundings of the users individual research.

## Features

The scope of the current state of the search engine lies on the processing of given documents provided by the CORD-19 Dataset and both ad-hoc and metadata information retrieval provided by the developed search engine and its web interface. Additional components such as a web crawler for identifying new publications are currently missing but are planned for a later date in order to update the data volume to newer COVID-19 literature and the functionality to use this project as a small scale general purpose scientific search engine.

### Processing:
- Document and inverted index construction
- Keyphrase extraction
- Metadata property graph

### Web-Application:
- **Ad-hoc search:** Retrieve documents based on a given search query using a boolean retrieval model
- **Query level metadata analysis:**
   - Query the statistic of the geographical location of institutions involved in a set of given papers, defined by a previous ad-hoc search request.
- **Document level metadata analysis:**
  -  Analyze the publication statistics of a specified author (currently: number of papers published)
  -  Analyze the publication statistics of a specified institution (currently: number of papers published)


## Quick Start

### Manual Installation

#### Prerequisites

- MongoDB: https://www.mongodb.com/de
- Neo4j: https://neo4j.com/
- Redis: https://redis.io/

- Python https://www.python.org/
- Node.js https://nodejs.org/


>Note: This section describes the overall requirements (software requirements, databases and datasets) for creating this search engine based on the CORD-19 dataset. Specific requirements for the data processing and the web application frontend and backend are either described in the package.json of the node projects or as pip installation instructions in the .ipynb notebooks component documentations.

#### Default Database Configuration:

|Database|Port|
|---|---|
|MongoDB|27017|
|Neo4j|7687|
|Redis|27018|

#### Covid Open Research Dataset (CORD-19 <cite>[1]</cite>)

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

## Architecture

The following depiction describes a high level overview over the established architecture used for this project. 
For this project a three-tier architecture was chosen in order to provide an independent layer for each of the main elements (presentation-tier (gui), application-tier (search engine), data-tier (data models)). This enables individual components of the architecture to be changed or redesigned with little effort. The established architecture which was developed around the two basic components for ad-hoc search providing suitable interfaces and processing steps in order to meet the requirements as described above in the [features](#features) section. The corresponding in detail description of each component is provided in the following component level documentation which are referred in the section below.

</br>


<p align="center">
  <img width=65% src="doc/search_engine_design.png">
</p>

**Fig 1** Established three-tier architecture used in order to provide the functionality required for the ad-hoc and metadata search functionality



</br>

## Documentation of the Specified Components (bottom up)

- [document processing + construction of data models (CORD-19)](processing/README.md)
- [web-application backend](web_application/backend/README.md)
- [web-application frontend](web_application/frontend/README.md)


## Roadmap

- Additional processing and extension of document metadata
- Advanced search query processing &rarr; natural language understanding
- Development of a document and database level knowledge graph in order to provide short answers to user given search queries
- Development of a web crawler in order to search for new literature in the area of COVID-19 or new topics
- ...

## References:

[1] Arif Jinha. Article 50 million: An estimate of the numberof scholarly articles in existence.Learned Publishing,23(3):258–263, 2010.

[2] Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze. 2008. Introduction to Information Retrieval. Cambridge University Press, USA.

[3] Lu Wang L, Lo K, Chandrasekhar Y, et al. CORD-19: The Covid-19 Open Research Dataset. Preprint. ArXiv. 2020;arXiv:2004.10706v2. Published 2020 Apr 22. 

---

Icon Made by [Freepik](https://www.flaticon.com/free-icon/virus_2659980?term=virus&page=1&position=1) from [flaticon.com](https://www.flaticon.com/)