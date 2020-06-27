import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import { Pagination } from '@material-ui/lab';

import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';
import WorldMap from './components/WorldMap';
import Metadata from './components/Metadata';
import AdditionalInfo from './components/AdditionalInfo';
import BarChart from './components/BarChart';

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
            metadata: []
        };
    }


    loadDocuments = (newQuery) => {
        const page = this.state.currentPage - 1;
        const searchTerm = this.state.searchTerm;

        fetch(`/search?term=${encodeURIComponent(searchTerm)}&page=${encodeURIComponent(page)}&numDocuments=${encodeURIComponent(10)}`)
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
    
        fetch(`/metadata?term=${encodeURIComponent(searchTerm)}`)
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
            console.log(json);
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
                        <Row style={{paddingBottom: '50px'}}>
                            <div style={{maxWidth: '600px', contentAlign: 'left'}}>
                                <SimilarTopics
                                    keywords={this.state.similarTopics}
                                    onTopicSelected={this.selectTopic.bind(this)}/>
                            </div>
                        </Row>
                        <Row>
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
                        <Row style={{paddingBottom: '30px'}}>
                            <WorldMap data={this.state.countryMetadata}/>
                        </Row>
                        <Row>
                            { 
                                this.state.selectedDocument !== undefined ?
                                <div style={{widht: '100%', display: 'flex'}}>
                                    <Col md="4">
                                        <Metadata 
                                            document={this.state.selectedDocument}
                                            onLinkClicked={() => {console.log('load document')}}
                                            onStatisticsClicked={this.fetchStatistics.bind(this)}/>
                                    </Col>
                                    <Col md="7">
                                        <Row>
                                            <BarChart data={this.state.metadata}/>
                                        </Row>
                                        <Row>
                                            <AdditionalInfo/>
                                        </Row>
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
