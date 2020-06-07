import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import { makeStyles } from '@material-ui/core/styles';
import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';
import WorldMap from './components/WorldMap';
import { Pagination } from '@material-ui/lab';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchQuery: '',
            searchResults: [],
            pages: 0,
            loadedDocuments: [],
            similarTopics: []
        };
    }


    loadDocuments(page, n, that = this) {
        if(page * n > that.state.searchResults.length) {
            return;
        }

        const items = that.state.searchResults.slice(page * n, Math.min((page + 1) * n, that.state.searchResults.length));
        console.log(`update ${page}`);

        fetch(`/document?doc_id=${encodeURIComponent(items)}`)
            .then(res => res.json())
            .then(json => that.setState({loadedDocuments: json}));
    }

    submit = (searchTerm) => {
        const that = this;

        fetch(`/search?term=${encodeURIComponent(searchTerm)}`)
            .then(res => res.json())
            .then(json => {
                var doc_ids = json['doc_ids'];
                var keyphrases = json['keyphrases'];
                that.setState({pages: Math.ceil(doc_ids.length/10)}, () => console.log(that.state.pages))
                that.setState({searchResults: doc_ids}, () =>   {that.loadDocuments(0, 10, that)});
                that.setState({similarTopics: keyphrases});
            });
    }

    pageChange(event, page) {
        this.loadDocuments(page, 10, this)
    }

    render() {
        console.log(this.state);

        return (
            <div className="App">
              <Container fluid>
                <Row>
                    <Header submit={this.submit}/>
                </Row>
                <Row style={{padding: '60px'}}>
                    <Col md="6">
                        <Row style={{paddingBottom: '50px'}}>
                            <div>
                                <div style={{maxWidth: '600px', contentAlign: 'left'}}>
                                <SimilarTopics keywords={this.state.similarTopics} submit={this.submit}/>
                                </div>
                            </div>
                        </Row>
                        <Row>
                            <div>
                            <Documents documents={this.state.loadedDocuments}/>
                            <Pagination style={{paddingTop: '20px'}} count={this.state.pages} shape="rounded" onChange={this.pageChange.bind(this)}/>
                            </div>
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
