import React, { Component } from 'react';
import {Container,  Row, Col} from "react-bootstrap";
import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchQuery: '',
            searchResults: [1, 2, 3, 4],
            loadedDocuments: [
                /*
                {_id: 0, document_title: 'What are We Depressed about When We Talk about COVID19: Mental Health Analysis on Tweets Using Natural Language Processing'},
                {_id: 0, document_title: 'A Fully Distributed, Privacy Respecting Approach for Back-tracking of Potentially Infectious Contacts'},
                {_id: 0, document_title: 'Learning as We Go -An Examination of the Statistical Accuracy of COVID19 Daily Death Count Predictions'},
                {_id: 0, document_title: 'An Ensemble Approach to Predicting the Impact of Vaccination on Rotavirus Disease in Niger'},
                {_id: 0, document_title: 'Perception of emergent epidemic of COVID-2019 / SARS CoV-2 on the Polish Internet'},
                {_id: 0, document_title: 'Short linear motif candidates in the cell entry system used by SARS-CoV-2 and their potential therapeutic implications'},
                {_id: 0, document_title: 'How to reduce epidemic peaks keeping under control the time-span of the epidemic'}
                */
            ],
            similarTopics: [
                'covid-19', 'sars-cov-2', 
                'transmission', 'vaccine', 
                'host cell', 'interdomain salt bridges', 
                'md trajectory', 'oxygen',
                'patient pathway', 'expiratory pressure',
                'host cell', 'interdomain salt bridges', 
                'md trajectory', 'oxygen',
                'patient pathway', 'expiratory pressure'
            ]
        };
    }


    loadDocuments(page, n, that = this) {
        if(page * n > that.state.searchResults.length) {
            return;
        }

        const items = that.state.searchResults.slice(page * n, Math.min((page + 1) * n, that.state.searchResults.length));

        fetch(`/document?doc_id=${encodeURIComponent(items)}`)
            .then(res => res.json())
            .then(json => that.setState({loadedDocuments: json}));
    }

    submit = (searchTerm) => {
        const that = this;

        fetch(`/search?term=${encodeURIComponent(searchTerm)}`)
            .then(res => res.json())
            .then(json => that.setState({searchResults: json}, () => that.loadDocuments(0, 10, that)));
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
                                <h5 style={{textAlign: 'left'}}>Similar Topics</h5>
                                <div style={{maxWidth: '600px', contentAlign: 'left'}}>
                                <SimilarTopics keywords={this.state.similarTopics}/>
                                </div>
                            </div>
                        </Row>
                        <Row>
                            <div>
                            <Documents documents={this.state.loadedDocuments}/>
                            </div>
                        </Row>
                    </Col>
                    <Col md="4">
                        <h5>TODO: Graphs</h5> 
                    </Col>
                </Row>
              </Container>
            </div>
            );
    }
}

export default App;
