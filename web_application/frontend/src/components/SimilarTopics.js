import React, { Component } from 'react'
import { Badge } from 'react-bootstrap'

export class SimilarTopics extends Component {
    render() {
        return (
            this.props.keywords.map((keyword) => (
                <Badge pill variant="primary" style={{marginRight: '5px'}}> {keyword} </Badge>
            ))
            )
    }
}

export default SimilarTopics
