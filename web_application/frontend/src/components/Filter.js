import React, { Component } from 'react'
import { Chip } from '@material-ui/core'
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

export class Filter extends Component {

    render() {
        console.log(this.props.filters)
        return (
            <div>
                {
                    this.props.filters.map(filter => {
                        return (
                            <Chip 
                                onDelete={() => this.props.onDeleteFilter(filter.value)} 
                                label={filter.value} 
                                deleteIcon={<HighlightOffIcon/>}
                                style={{marginRight: '5px'}}/>
                        )
                    })
                }
            </div>
        )
    }
}

export default Filter
