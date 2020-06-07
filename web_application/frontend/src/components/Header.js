import './Header.css'
import search from '../assets/icons/search-white-18dp.svg'
import Particles from 'react-particles-js';
import React, { Component } from 'react'
import { Image } from 'react-bootstrap'

//TODO: Make header reactive 
export class Header extends Component {

    constructor() {
        super()
        this.state = { searchTerm: "" }
    }

    handleChange = (e) => this.setState({searchTerm: e.target.value})

    handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            this.props.submit(this.state.searchTerm)
        }
    }

    //<Image src={background} style={{zIndex: '-1', height: '100%', width: '100%'}}/>//
    //<VirusIcon className='app-icon'/>

    render() {
        return (
            <div className='header-collapsed'>
               <Particles params={{"particles": {
                    "number": {
                        "value": 150,
                        "density": {
                            "enable": true,
                            "value_area": 1803.4120608655228
                        }
                    }}}}/>
                <div className='topLeft'>
                    <div style={{display: 'flex'}}>
                        <div style={{paddingLeft: '0px'}}>
                            <h1 className='title'>Covid-19 Insights</h1>
                            <h6 className='title'>A search engine for covid-19 literature research</h6>
                        </div>
                    </div>
                    <input  className='custom-search-field' 
                            type='text' 
                            placeholder='What are you looking for ?'
                            value={this.state.searchTerm} 
                            onChange={this.handleChange}
                            onKeyDown={this.handleKeyDown} />
                        
                    <Image onClick={() => this.props.submit(this.state.searchTerm.bind(this))} src={search} className='search-icon'/>
                </div>
            </div>
        )
    }
}

export default Header
