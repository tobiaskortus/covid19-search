import './Header.css'
import search from '../assets/icons/search-white-18dp.svg'
import clear from '../assets/icons/clear-white-18dp.svg'

import Particles from 'react-particles-js';
import React, { Component } from 'react'
import { Image } from 'react-bootstrap'
import { Tooltip } from '@material-ui/core'


const ENTER = 13;

//TODO: Make header reactive 
export class Header extends Component {

    constructor() {
        super()
        this.state = { searchTerm: "" }
        this.particleParams = {
            "particles": {
                "number": {
                    "value": 150,
                    "density": {
                        "enable": true,
                        "value_area": 1803.4120608655228
                    }
                }
            }
        };
    }

    handleChange = (e) => this.setState({searchTerm: e.target.value})

    handleKeyDown = (e) => {
        if (e.keyCode === ENTER) {
            this.props.submit(this.state.searchTerm)
        }
    }

    render() {
        return (
            <div className='header-collapsed'>
               <Particles params={this.particleParams}/>
                    
                <div className='top-left'>
                    <div style={{display: 'flex'}}>
                        <div style={{paddingLeft: '0px'}}>
                            <h1 style={{fontSize: '40px'}} className='title'>Covid Open Research Engine</h1>
                            <h6 className='title'>A search engine for covid-19 literature research</h6>
                        </div>
                    </div>

                    <div className='input-container'>
                        <input  className='transparent-search-field' 
                                type='text' 
                                placeholder='What are you looking for ?'
                                value={this.state.searchTerm} 
                                onChange={this.handleChange}
                                onKeyDown={this.handleKeyDown} />
                        
                        <div className='icon-container'>
                            {
                                this.state.searchTerm !== '' &&
                                <Tooltip title='clear search input'>
                                <Image onClick={() => this.setState({searchTerm: ''})} src={clear} className='search-icon'/>
                                </Tooltip>
                            }
                    
                            <Tooltip title='search'>
                                <Image onClick={() => this.props.submit(this.state.searchTerm)} src={search} className='search-icon'/>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Header
