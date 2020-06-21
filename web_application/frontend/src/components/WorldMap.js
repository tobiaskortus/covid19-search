import React, { Component } from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

class WorldMap extends Component {
  // Create map instance
  componentDidMount() {
    this.initializeChart();
  } 

  componentDidUpdate(previous) {
    
    if(previous.data !==this.props.data) {
      this.initializeChart();
      this.map.validateData();
    }
  }

  initializeChart() {
    var chart = am4core.create("mapdiv", am4maps.MapChart);

    var data = this.props.data.map(entry => {
      return {'id': entry['id'], 'name': entry['name'], 'value': entry['value'], 'color': chart.colors.getIndex(0)}
    });
  
    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Miller();

    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.exclude = ["AQ"];
    polygonSeries.useGeodata = true;
    polygonSeries.nonScalingStroke = true;
    polygonSeries.strokeWidth = 0.5;
    polygonSeries.calculateVisualCenter = true;

    var imageSeries = chart.series.push(new am4maps.MapImageSeries());
    imageSeries.data = data;
    imageSeries.dataFields.value = "value";

    var imageTemplate = imageSeries.mapImages.template;
    imageTemplate.nonScaling = true

    var circle = imageTemplate.createChild(am4core.Circle);
    circle.fillOpacity = 0.7;
    circle.propertyFields.fill = "color";
    circle.tooltipText = "{name}: [bold]{value}[/]";


    imageSeries.heatRules.push({
      "target": circle,
      "property": "radius",
      "min": 4,
      "max": 15,
      "dataField": "value"
    });

    imageTemplate.adapter.add("latitude", function(latitude, target) {
      var polygon = polygonSeries.getPolygonById(target.dataItem.dataContext.id);
      if(polygon){
        return polygon.visualLatitude;
      }
      return latitude;
    })

    imageTemplate.adapter.add("longitude", function(longitude, target) {
      var polygon = polygonSeries.getPolygonById(target.dataItem.dataContext.id);
      if(polygon){
        return polygon.visualLongitude;
      }
      return longitude;
    })

    this.map = chart;
  }

  componentWillUnmount() {
    if (this.map) {
      this.map.dispose();
    }
  }

  render() {
    return (
      <div id="mapdiv" style={{ width: "100%", height: "300px" }}></div>
    );
  }
}

export default WorldMap;