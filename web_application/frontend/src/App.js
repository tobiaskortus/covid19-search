import './App.css';

import React, { Component } from 'react';
import {Container, Image, Row, Col, Button} from "react-bootstrap";
import SimilarTopics from './components/SimilarTopics';
import Header from './components/Header';

class App extends Component {

    constructor() {
        super();
        this.state = {
            _id: -1,
            document_title: 'None'
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
        return (
            <div className="App">
              <Container fluid>
                <Row>
                    <Header/>
                </Row>
                <Row style={{padding: '20px'}}>
                    <Col md="6">
                        <Row style={{paddingBottom: '50px'}}>
                            <SimilarTopics/>
                        </Row>
                        <Row>
                            <br/>
                            <h5>TODO: Literature</h5>
                            <h3>{this.state.document_title}</h3>
                            <br/>
                            <Button onClick={this.buttonGetDocumentTest}>Get Data</Button>
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
