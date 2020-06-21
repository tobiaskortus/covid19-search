import './Header.css'

import Particles from 'react-particles-js';
import React, { Component } from 'react';
import { Tooltip } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';


const ENTER = 13;

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

        this.lastParentUpdate = ''
    }

    handleChange = (e) => this.setState({searchTerm: e.target.value})

    componentDidUpdate(previous) {
        if(this.lastParentUpdate != this.props.searchTerm) {
          this.setState({searchTerm: this.props.searchTerm});
          this.lastParentUpdate = this.props.searchTerm;
        }
      }

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
                                    <ClearIcon onClick={() => this.setState({searchTerm: ''})}/>
                                </Tooltip>
                            }
                    
                    
                            <Tooltip title='search'>
                                <SearchIcon onClick={() => this.props.submit(this.state.searchTerm)}/>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Header
