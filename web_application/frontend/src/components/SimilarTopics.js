import React, { Component } from 'react'
import { Badge } from './Badge.js'

export class SimilarTopics extends Component {
    render() {
        return (
            this.props.keywords.map((keyword) => (
                <Badge title={keyword}/>
            ))
            )
    }
}

export default SimilarTopics
