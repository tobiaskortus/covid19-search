import React, { Component } from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

class BarChart extends Component {

  componentDidMount() {
    this.chart = undefined;
    this.initializeChart([]);
  } 

  componentDidUpdate(previous) {
    if(previous.data !==this.props.data) {
      this.initializeChart(this.props.data.metadata);
      this.chart.validateData();
    }
  }

  initializeChart(data) {
    if (data.length === 0) {
      return
    }

    if(this.chart !== undefined) {
      this.chart.dispose();
    }
    
    var chart = am4core.create("chartdiv", am4charts.XYChart);

    chart.fontSize = 12;

    chart.data = data.map(obj => {return {'name': obj.name, 'count': obj.count};})

    var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "name";
    categoryAxis.numberFormatter.numberFormat = "#";
    categoryAxis.renderer.inversed = true;
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.renderer.cellStartLocation = 0.1;
    categoryAxis.renderer.cellEndLocation = 0.9;
    
    var  valueAxis = chart.xAxes.push(new am4charts.ValueAxis()); 
    valueAxis.renderer.opposite = true;
      
      // Create series
      function createSeries(field, name) {
        var series = chart.series.push(new am4charts.ColumnSeries());

        series.columns.template.column.cornerRadiusBottomRight = 5;
        series.columns.template.column.cornerRadiusTopRight = 5;

        series.dataFields.valueX = field;
        series.dataFields.categoryY = "name";
        //series.columns.template.height = am4core.percent(50);
        series.sequencedInterpolation = true;
      
        var valueLabel = series.bullets.push(new am4charts.LabelBullet());
        valueLabel.label.text = "{valueX}";
        valueLabel.label.horizontalCenter = "left";
        valueLabel.label.dx = 10;
        valueLabel.label.hideOversized = false;
        valueLabel.label.truncate = false;
      
        var categoryLabel = series.bullets.push(new am4charts.LabelBullet());
        categoryLabel.label.text = "{name}";
        categoryLabel.label.horizontalCenter = "right";
        categoryLabel.label.dx = -10;
        categoryLabel.label.fill = am4core.color("#fff");
        categoryLabel.label.hideOversized = false;
        categoryLabel.label.truncate = false;

        var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        //categoryAxis.renderer.cellStartLocation = 0.1;
        //categoryAxis.renderer.cellEndLocation = 0.9;
      }
      
    createSeries("count", "Number of Publications");
    this.chart = chart;

    //Resize chart based on content
    let cellSize = 40;
    this.chart.events.on("datavalidated", function(ev) {
      let chart = ev.target;
      let categoryAxis = chart.yAxes.getIndex(0);
      let adjustHeight = chart.data.length * cellSize - categoryAxis.pixelHeight;
      let targetHeight = chart.pixelHeight + adjustHeight;
      chart.svgContainer.htmlElement.style.height = targetHeight + "px";
    });
  }

  componentWillUnmount() {
    if (this.map) {
      this.chart.dispose();
    }
  }

  render() {
    return (
      <div id="chartdiv" style={{ width: "100%", height: "300px" }}></div>
    );
  }
}

export default BarChart;