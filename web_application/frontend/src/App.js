import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import { Pagination } from '@material-ui/lab';

import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';
import WorldMap from './components/WorldMap';
import Metadata from './components/Metadata';
import BarChart from './components/BarChart';
import Filter from './components/Filter';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: '',
            searchResults: [],
            pages: 0,
            currentPage: 1,
            loadedDocuments: [],
            similarTopics: [],
            countryMetadata: [],
            selectedDocument: undefined,
            metadata: [],
            filters: []
        };
    }

    loadDocuments = (newQuery) => {
        const page = this.state.currentPage - 1;
        const searchTerm = this.state.searchTerm;
        const filters = JSON.stringify(this.state.filters);

        fetch(`/search?term=${encodeURIComponent(searchTerm)}
                      &page=${encodeURIComponent(page)}
                      &numDocuments=${encodeURIComponent(10)}
                      &filters=${encodeURIComponent(filters)}`)
            .then(res => res.json())
            .then(json => {
                this.setState({pages: json.pages})
                this.setState({loadedDocuments: json.documents});
                this.setState({similarTopics: json.keyphrases});

                if(newQuery) {
                    this.loadCountries();
                }
            });
    }

    loadCountries = () => {
        const searchTerm = this.state.searchTerm;
    
        fetch(`/geo?term=${encodeURIComponent(searchTerm)}`)
            .then(res => res.json())
            .then(json => {
                this.setState({countryMetadata: json.countries})
            });
    }

    pageChange(event, page) { 
        this.setState({currentPage: page}, () => { 
            this.loadDocuments(); 
        }); 
    }

    searchQueryChange(searchTerm) { 
        var newQuery = false;

        if (this.state.searchTerm !== searchTerm) {
            this.setState({currentPage: 1});
            newQuery = true;
        }
        
        this.setState({searchTerm: searchTerm}, () => { 
            this.loadDocuments(newQuery); 
        }); 
    }

    selectDocument(doc_id) {
        //Only update selected document if no document was previously loaded
        //or the new selected document is not the same as the current 
        if(this.selectedDocument !== undefined && 
           this.selectedDocument.doc_id === doc_id) {
            return;
        }

        fetch(`/document?doc_id=${encodeURIComponent(doc_id)}`)
        .then(res => res.json())
        .then(json => {
            this.setState({selectedDocument: json}, () => {
                this.fetchStatistics(this.state.selectedDocument.authors, 'authors');
            });
        });
    }

    fetchStatistics(authors_obj, type) {
        var params;
    
        switch (type) {
            case 'authors':
                params = authors_obj.map(tuple => {return tuple.author;})
                break;
            case 'institutions':
                params = authors_obj.map(tuple => {return tuple.institution;})
                break;
        }

        var unique_params = params.filter(function(item, pos, self) {
            return self.indexOf(item) === pos;
        })

        fetch(`/statistics?type=${encodeURIComponent(type)}&params=${encodeURIComponent(unique_params)}`)
        .then(res => res.json())
        .then(json => {
            this.setState({metadata: json});
        })
    }

    selectTopic(topic) {
        var newQuery = false;

        if (this.state.searchTerm !== topic) {
            this.setState({currentPage: 1});
            newQuery = true;
        }

        this.setState({searchTerm: topic}, () => { 
            this.loadDocuments(newQuery); 
        }); 
    }

    selectFilter(category, value) {

        if (value == 'undefined')  {
            return
        }

        const filter = {
            category: category,
            value: value
        };

        if (!this.state.filters.some(x => x.value === value)) {
            this.setState(prev_state => ({filters: [...prev_state.filters, filter]}), () => {
                this.loadDocuments(false); 
            })
        }
    }

    deleteFilter(value) {
        this.setState({filters: this.state.filters.filter(x => x.value != value)}, () => {
            this.loadDocuments(false); 
        });
    }


    render() {
        return (
            <div className="App">
              <Container fluid>
                <Row>
                    <Header 
                        searchTerm={this.state.searchTerm}
                        submit={this.searchQueryChange.bind(this)}/>
                </Row>
                <Row style={{padding: '60px'}}>
                    <Col md="6">
                        <Row style={{paddingBottom: '25px'}}>
                            <div style={{maxWidth: '600px', contentAlign: 'left'}}>
                                <SimilarTopics
                                    keywords={this.state.similarTopics}
                                    onTopicSelected={this.selectTopic.bind(this)}/>
                            </div>
                        </Row>
                        <Row>
                            {
                                (this.state.loadedDocuments.length !== 0 || this.state.filters.length !== 0) &&
                                <div style={{paddingBottom: '15px'}} >
                                    <Filter 
                                        filters={this.state.filters}
                                        onDeleteFilter={this.deleteFilter.bind(this)}/>
                                </div>
                            }
                            {
                                this.state.loadedDocuments.length !== 0 &&
                                <div>               
                                    <Documents 
                                        documents={this.state.loadedDocuments}
                                        onSelectDocument={this.selectDocument.bind(this)}/>
                                    
                                    <Pagination style={{paddingTop: '20px'}} 
                                        page={this.state.currentPage}
                                        count={this.state.pages} shape="rounded" 
                                        onChange={this.pageChange.bind(this)}/>
                                </div>
                            }
                        </Row>
                    </Col>
                    <Col md="6">
                        <Row style={{paddingBottom: '30px', marginLeft: '50px'}}>
                            <WorldMap 
                                data={this.state.countryMetadata}
                                onCountryClicked={this.selectFilter.bind(this)}/>
                        </Row>
                        <Row style={{marginLeft: '50px'}}>
                            { 
                                this.state.selectedDocument !== undefined ?
                                <div style={{widht: '100%', display: 'flex'}}>
                                    <Col md="4">
                                        <Metadata 
                                            document={this.state.selectedDocument}
                                            onStatisticsClicked={this.fetchStatistics.bind(this)}
                                            onElementClicked={this.selectFilter.bind(this)}
                                            />
                                    </Col>
                                    <Col md="7">
                                        <BarChart data={this.state.metadata}/>
                                    </Col>
                                </div> 
                                :
                                <div style={{margin: '0 auto'}}>
                                   <h5 style={{color: '#aaa', paddingTop: '200px'}}>
                                       Select a document to show additional information !
                                    </h5>
                                </div> 
                            }
                        </Row>
                    </Col>
                </Row>
              </Container>
            </div>
        );
    }
}

export default App;
