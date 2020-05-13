import './Badge.css'
import React, { Component } from 'react'

export class Badge extends Component {
    render() {
        return (
            <div className='badge'>
                <p class='badge-text'>{this.props.title}</p>
            </div>
        )
    }
}

export default Badge
