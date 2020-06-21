import React, { Component } from 'react'
import { ListGroup, Row } from 'react-bootstrap'
import BarChart from './BarChart'

export class AdditionalInfo extends Component {
    render() {
        return (
            <div>
                <Row>
                    <BarChart/>
                </Row>
                <Row>
                    <ListGroup style={{width: "100%"}}>
                        <ListGroup.Item>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                        </ListGroup.Item>
                    </ListGroup>
                </Row>
            </div>
        )
    }
}

export default AdditionalInfo
