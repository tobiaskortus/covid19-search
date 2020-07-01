import React, { Component } from 'react'
import { Link } from '@material-ui/core'

export class Documents extends Component {
    render() {
        return this.props.documents.map((document) => (
            <div>
                <Link 
                    href="#" 
                    style={{fontSize: "15px", color: 'black'}} 
                    onClick={() =>{
                        this.props.onSelectDocument(document._id); 
                        return false;}
                        }>
                    {document.document_title}
                </Link> 

                <br/>
                    {
                        document.authors.slice(0, Math.min(4, document.authors.length)).map(author => {
                            return(
                                <Link style={{fontSize: "12px", color: 'green'}}>{author['author']} - </Link>
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
