const d3 = require('d3');

//LineChart initialization
var margin = { top: 50, right : 50, bottom: 50, left: 50},
    lchart_width = 500, //window.innerWidth - margin.left - margin.right,
    lchart_height = 350; //window.innerHeight - margin.top - margin.bottom;

var lchart = d3.select('#line_chart_container')
               .append('svg')
                .attr('width', lchart_width + margin.left + margin.right)
                .attr('height', lchart_height + margin.top + margin.bottom)
               .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top +')');

function populateChart(battles) {
  var battles_won = battles.filter(function(d) { return d.outcome == 'W'; });
  //console.log(battles_won);

  //Axis scales and line
  var xScale = d3.scaleLinear()
                 .domain([0 , d3.max(battles, function (d) { return Math.abs(+d.year); })])
                 .range([0, lchart_width]);

  var range = d3.range(battles_won.length);
  var yScale = d3.scaleLinear()
                  .domain([0, battles_won.length - 1])
                  .range([lchart_height, 0]);

  var line = d3.line()
                .x(function(d) {
                  return xScale(Math.abs(+d.year));
                })
                .y(function(d, i) {
                  return yScale(i);
                })
                .curve(d3.curveMonotoneX);

  lchart.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0, ' + lchart_height + ')')
        .call(d3.axisBottom(xScale));

  lchart.append('g')
          .attr('class', 'y axis')
        .call(d3.axisLeft(yScale));

  lchart.append('path')
        .datum(battles_won)
          .attr('class', 'line')
          .attr('d', line);
}

export default {
  populateChart : populateChart
}
