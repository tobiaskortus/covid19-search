import React, { Component } from 'react'
import { Button, Badge } from 'react-bootstrap'

export class SimilarTopics extends Component {
    render() {
        return (
            <div>
                <h5 style={{textAlign: 'left'}}>Similar Topics</h5>
                <div style={{maxWidth: '400px', contentAlign: 'left'}}>
                    <Badge pill variant="primary"> Covid-19 </Badge>{' '}
                    <Badge pill variant="primary"> Transmission </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                    <Badge pill variant="primary"> Covid-19 </Badge>{' '}
                    <Badge pill variant="primary"> Transmission </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                    <Badge pill variant="primary"> Vacination </Badge>{' '}
                </div>
            </div>
        )
    }
}

export default SimilarTopics
