import React, { Component } from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

class BarChart extends Component {
  // Create map instance
  componentDidMount() {
    this.initializeChart();
  } 

  componentDidUpdate(previous) {
    if(previous.data !==this.props.data) {
      this.initializeChart();
      this.chart.validateData();
    }
  }

  initializeChart() {
    var chart = am4core.create("chartdiv", am4charts.XYChart);

    chart.data = [{
        "year": "A. Donnat",
        "income": 12,
      },{
        "year": "B. Donnat",
        "income": 141,
      },{
        "year": "C. Donnat",
        "income": 21,
      },{
        "year": "D. Donnat",
        "income": 14,
      },{
        "year": "E. Donnat",
        "income": 12,
      }];

      var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "year";
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
        series.columns.template.fill = am4core.color("#292E49");

        series.dataFields.valueX = field;
        series.dataFields.categoryY = "year";
        series.columns.template.height = am4core.percent(100);
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
      }
      
      createSeries("income", "Income");
    this.chart = chart;
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