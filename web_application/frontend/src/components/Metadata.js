import React, { Component } from 'react'
import { ListGroup } from 'react-bootstrap'
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import PersonIcon from '@material-ui/icons/Person';
import ApartmentIcon from '@material-ui/icons/Apartment';

export class Metadata extends Component {
    render() {
        return (
            <div>
                <ListGroup>
                    <ListGroup.Item>
                        <h7>Modeling the Heterogeneity in COVID-19's Reproductive Number and Its Impact on Predictive Scenarios</h7> <PictureAsPdfIcon/> <PersonIcon/> <ApartmentIcon/>
                    </ListGroup.Item> 
                    <ListGroup.Item>
                        <h6 style={{paddingBottom: "8px"}}>Authors </h6>
                        <p style={{lineHeight: "0.6", fontSize: "12px"}}>C. Donnat - ABC</p>
                        <p style={{lineHeight: "0.6", fontSize: "12px"}}>A. S. Holmes - ABC</p>
                        <p style={{lineHeight: "0.6", fontSize: "12px"}}>B. S. Holmes - ABC</p>
                        <p style={{lineHeight: "0.6", fontSize: "12px"}}>F. S. Holmes - ABC</p>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <h6>Abstract</h6>
                        <p style={{fontSize: "12px"}}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna 
                            aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
                            takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                            tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et 
                            accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
                    </ListGroup.Item>
                </ListGroup>
            </div>
        )
    }
}

export default Metadata
