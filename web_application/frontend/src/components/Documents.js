import React, { Component } from 'react'

export class Documents extends Component {
    render() {
        return this.props.documents.map((document) => (
            <div>
                <a href="#" style={{fontSize: "15px", color: 'black'}}>{document.document_title}</a> 
                <br/>
                {
                    document.authors.slice(0, Math.min(4, document.authors.length)).map(author => {
                        return(
                            <a href="#" style={{fontSize: "12px", color: 'green'}}> {author} ·</a>
                        )
                    })
                }
                <br/>
                <p style={{fontSize: "12px"}}>{document.abstract}</p>
            </div>
        ))
    }
}

export default Documents
