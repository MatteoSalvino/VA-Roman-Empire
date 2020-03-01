const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var isCumulative = true;
var xScale, yScale, xAxis, yAxis, line, path;

var container = d3.select("#line_chart_container")
    .append("div")
    // Container class to make it responsive.
    .classed("svg-container", true);

var lchart = container.append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    // Class to make it responsive.
    .classed("svg-content-responsive", true);

//Clip path in order to cut out everything out the chart
var clip = lchart.append('defs')
                 .append('svg:clipPath')
                 .attr('id', 'clip')
                 .append('svg:rect')
                 .attr('width', width - margin.left - margin.right)
                 .attr('height', height - margin.top - margin.bottom)
                 .attr('x', margin.left)
                 .attr('y', margin.top);

lchart.append("rect")
    .classed("rect_b", true)
    .attr("width", width)
    .attr("height", height);

var brush = d3.brushX()
              .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
              .on('end', brushend);



function populateChart(battles) {
    var wonBattles = battles.filter(function(d) { return d.outcome == 'W'; });
    var lostBattles = battles.filter(function(d) { return d.outcome == 'L'; });
    var civilBattles = battles.filter(function(d) { return d.outcome == 'C'; });
    console.log(wonBattles);
    console.log(lostBattles);

    //Axis scales
    xScale = d3.scaleLinear()
        .domain([d3.min(battles, function(d) { return +d.year; }), d3.max(battles, function(d) { return +d.year; })])
        .range([margin.left, width - margin.right]);

    //var range = d3.range(battles_won.length);
    yScale = d3.scaleLinear()
        .domain([0, d3.max([1, wonBattles.length, lostBattles.length]) - 1])
        .range([height - margin.bottom, margin.top]);


    //x axis and lines
    line = lchart.append('g')
                  .attr('clip-path', 'url(#clip)');

    path = d3.line()
                 .x(function(d) {
                   return xScale(+d.year);
                  })
                  .y(function(_d, i) {
                    return yScale(i);
                  })
                  .curve(d3.curveMonotoneX);

    line.append('path')
        .datum(wonBattles)
          .attr('class', 'line')
          .attr('d', path);

    line.append('path')
        .datum(lostBattles)
          .attr('class', 'line')
          .attr('d', path);

    line.append('path')
        .datum(civilBattles)
          .attr('class', 'line')
          .attr('d', path);


    line.append('g')
        .attr('class', 'brush')
        .call(brush);

    xAxis = lchart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
          .call(d3.axisBottom(xScale)
                    .tickFormat(function(d) {
                      if (d == 0) return 0;
                      if (d < 0) return -d + "BC";
                        return d + "AD"
                    }));

    yAxis = lchart.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + margin.bottom + ', 0)')
          .call(d3.axisLeft(yScale));


    //Reset zoom
    lchart.on('dblclick', function() {
      xScale.domain([d3.min(battles, function(d) { return +d.year; }), d3.max(battles, function(d) { return +d.year; })]);
      xAxis.transition().duration(1500).call(d3.axisBottom(xScale)
                .tickFormat(function(d) {
                  if (d == 0) return 0;
                  if (d < 0) return -d + "BC";
                    return d + "AD"
                }));

      line.selectAll('.line')
          .transition()
          .duration(1500)
            .attr('d', path);
    });
}

function brushend() {
  var selection = d3.event.selection;

  if(selection) {
    //Updating scales
    xScale.domain([xScale.invert(selection[0]), xScale.invert(selection[1])]);
    line.select('.brush').call(brush.move, null);

    zooming();
  }
}

function zooming() {
  var transition = lchart.transition().duration(1000);

  //Transitioning x axis
  xAxis.transition(transition).call(d3.axisBottom(xScale)
            .tickFormat(function(d) {
              if (d == 0) return 0;
              if (d < 0) return -d + "BC";
                return d + "AD"
            }));

  //Transitioning line
  line.selectAll('.line')
      .transition(transition)
      .attr('d', path);
}

export default {
    populateChart: populateChart
}
