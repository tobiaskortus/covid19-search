import './App.css';

import React, { Component } from 'react';
import {Container,  Row, Col, Button} from "react-bootstrap";
import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';
import Documents from './components/Documents';

class App extends Component {

    constructor() {
        super();
        this.state = {
            searchQuery: '',
            searchResults: [
                {_id: 0, document_title: 'What are We Depressed about When We Talk about COVID19: Mental Health Analysis on Tweets Using Natural Language Processing'},
                {_id: 0, document_title: 'A Fully Distributed, Privacy Respecting Approach for Back-tracking of Potentially Infectious Contacts'},
                {_id: 0, document_title: 'Learning as We Go -An Examination of the Statistical Accuracy of COVID19 Daily Death Count Predictions'},
                {_id: 0, document_title: 'An Ensemble Approach to Predicting the Impact of Vaccination on Rotavirus Disease in Niger'},
                {_id: 0, document_title: 'Perception of emergent epidemic of COVID-2019 / SARS CoV-2 on the Polish Internet'},
                {_id: 0, document_title: 'Short linear motif candidates in the cell entry system used by SARS-CoV-2 and their potential therapeutic implications'},
                {_id: 0, document_title: 'How to reduce epidemic peaks keeping under control the time-span of the epidemic'}
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


    buttonGetDocumentTest = () => {
        console.log('button click')
        fetch(`/document?doc_id=${encodeURIComponent(0)}`)
            .then(res => res.json())
            .then(json => this.setState(json));
        
        console.log(this.state)
    }

    render() {
        console.log(this.state);
        return (
            <div className="App">
              <Container fluid>
                <Row>
                    <Header/>
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
                            <Documents documents={this.state.searchResults}/>
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
