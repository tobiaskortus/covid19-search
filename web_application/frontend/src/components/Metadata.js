import React, { Component } from 'react'
import { ListGroup } from 'react-bootstrap'
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import PersonIcon from '@material-ui/icons/Person';
import ApartmentIcon from '@material-ui/icons/Apartment';
import { Link } from '@material-ui/core';


export class Metadata extends Component {
    render() {
        return (
            <div>
                <ListGroup>
                    <ListGroup.Item>
                        <h7>{this.props.document.title}</h7> 
                        <br></br>
                        <PictureAsPdfIcon onClick={this.props.onLinkClicked}/> 
                        <PersonIcon onClick={() => {
                            console.log('authors')
                            this.props.onStatisticsClicked(this.props.document.authors, 'authors')
                            }}/> 
                        <ApartmentIcon onClick={() => {
                            console.log('institutions')
                            this.props.onStatisticsClicked(this.props.document.authors, 'institutions')
                        }}/>

                    </ListGroup.Item> 
                    <ListGroup.Item>
                        <h6 style={{paddingBottom: "8px"}}>Authors </h6>
                        {
                            this.props.document.authors.map((tuple) => {
                                return(
                                    <div>
                                        <Link href="#"  style={{fontSize: '12px'}} onClick={() =>{this.props.onElementClicked('author', tuple.author)}}>{tuple.author} - </Link>
                                        <Link href="#"  style={{fontSize: '12px'}} onClick={() =>{this.props.onElementClicked('institution', tuple.institution)}}>{tuple.institution}</Link>
                                    </div>
                                );
                            })
                        }
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <h6>Abstract</h6>
                        <p style={{fontSize: "12px"}}>{this.props.document.abstract}</p>
                    </ListGroup.Item>
                </ListGroup>
            </div>
        )
    }
}

export default Metadata
