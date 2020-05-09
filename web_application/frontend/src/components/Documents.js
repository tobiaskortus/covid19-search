import React, { Component } from 'react'

export class Documents extends Component {
    render() {
        console.log(this.props.documents);
        return this.props.documents.map((document) => (
            <div>
                <a href="#" style={{fontSize: "15px", color: 'black'}}>{document.document_title}</a>
                <p style={{fontSize: "10px"}}>{document._id}</p>
            </div>
        ))
    }
}

export default Documents
