import './Header.css'

import background from '../assets/images/background.jpg'
import search from '../assets/icons/search-white-18dp.svg'

import React, { Component } from 'react'
import { Image } from 'react-bootstrap'

//TODO: Make header reactive 

export class Header extends Component {
    render() {
        return (
            <div style={{width: '100%', height: '200px'}}>
                <Image src={background} style={{zIndex: '-1', height: '100%', width: '100%'}}/>
                <div className='topLeft'>
                    <div>
                        <h1 className='title'>Covid-19 Insights</h1>
                        <h6 className='title'>A search engine for covid-19 literature research</h6>
                    </div>
                    <input className='custom-search-field' type='text' placeholder='What are you looking for ?'/>
                    <Image src={search} className='icon'/>
                </div>
            </div>
        )
    }
}

export default Header
