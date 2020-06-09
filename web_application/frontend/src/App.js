import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import { Pagination } from '@material-ui/lab';

import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';
import WorldMap from './components/WorldMap';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: '',
            searchResults: [],
            pages: 0,
            currentPage: 1,
            loadedDocuments: [],
            similarTopics: []
        };
    }


    loadDocuments = () => {
        const page = this.state.currentPage - 1;
        const searchTerm = this.state.searchTerm;

        fetch(`/search?term=${encodeURIComponent(searchTerm)}&page=${encodeURIComponent(page)}&numDocuments=${encodeURIComponent(10)}`)
            .then(res => res.json())
            .then(json => {
                this.setState({pages: json.pages})
                this.setState({loadedDocuments: json.documents});
                this.setState({similarTopics: json.keyphrases});
            })
    }

    pageChange(event, page) { 
        this.setState({currentPage: page}, () => { 
            this.loadDocuments(); 
        }); 
    }

    searchQueryChange(searchTerm) { 
        if (this.state.searchTerm !== searchTerm) {
            this.setState({currentPage: 1});
        }
        this.setState({searchTerm: searchTerm}, () => { 
            this.loadDocuments(); 
        }); 
    }

    render() {
        return (
            <div className="App">
              <Container fluid>
                <Row>
                    <Header submit={this.searchQueryChange.bind(this)}/>
                </Row>
                <Row style={{padding: '60px'}}>
                    <Col md="6">
                        <Row style={{paddingBottom: '50px'}}>
                            <div style={{maxWidth: '600px', contentAlign: 'left'}}>
                                <SimilarTopics keywords={this.state.similarTopics}/>
                            </div>
                        </Row>
                        <Row>
                            <Documents documents={this.state.loadedDocuments}/>
                            <Pagination style={{paddingTop: '20px'}} 
                                page={this.state.currentPage}
                                count={this.state.pages} shape="rounded" 
                                onChange={this.pageChange.bind(this)}/>
                        </Row>
                    </Col>
                    <Col md="6">
                        <WorldMap/>
                    </Col>
                </Row>
              </Container>
            </div>
        );
    }
}

export default App;
