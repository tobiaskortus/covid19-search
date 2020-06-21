import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import { Pagination } from '@material-ui/lab';

import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';
import WorldMap from './components/WorldMap';
import Metadata from './components/Metadata';
import AdditionalInfo from './components/AdditionalInfo';

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
            countryMetadata: []
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

                console.log(json);
                
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
        console.log(doc_id);
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
                            <Documents 
                                documents={this.state.loadedDocuments}
                                onSelectDocument={this.selectDocument}/>
                                
                            <Pagination style={{paddingTop: '20px'}} 
                                page={this.state.currentPage}
                                count={this.state.pages} shape="rounded" 
                                onChange={this.pageChange.bind(this)}/>
                        </Row>
                    </Col>
                    <Col md="6">
                        <Row style={{paddingBottom: '30px'}}>
                            <WorldMap data={this.state.countryMetadata}/>
                        </Row>
                        <Row>
                            <Col md="4">
                                <Metadata/>
                            </Col>
                            <Col md="7">
                                <AdditionalInfo/>
                            </Col>
                        </Row>
                    </Col>
                </Row>
              </Container>
            </div>
        );
    }
}

export default App;
