const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var isCumulative = true;

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

lchart.append("rect")
    .classed("rect_b", true)
    .attr("width", width)
    .attr("height", height);

function populateChart(battles) {
    var wonBattles = battles.filter(function(d) { return d.outcome == 'W'; });
    var lostBattles = battles.filter(function(d) { return d.outcome == 'L'; });
    var civilBattles = battles.filter(function(d) { return d.outcome == 'C'; });
    console.log(wonBattles);
    console.log(lostBattles);

    //Axis scales and line
    var xScale = d3.scaleLinear()
        .domain([d3.min(battles, function(d) { return +d.year; }), d3.max(battles, function(d) { return +d.year; })])
        .range([margin.left, width - margin.right]);

    //var range = d3.range(battles_won.length);
    var yScale = d3.scaleLinear()
        .domain([0, d3.max([1, wonBattles.length, lostBattles.length]) - 1])
        .range([height - margin.bottom, margin.top]);

    var line = d3.line()
        .x(function(d) {
            return xScale(+d.year);
        })
        .y(function(_d, i) {
            return yScale(i);
        })
        .curve(d3.curveMonotoneX);

    lchart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
        .call(d3.axisBottom(xScale)
            .tickFormat(function(d) {
                if (d == 0) return 0;
                if (d < 0) return -d + "BC";
                return d + "AD"
            }));

    lchart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margin.bottom + ', 0)')
        .call(d3.axisLeft(yScale));

    lchart.append('path')
        .datum(wonBattles)
        .attr('class', 'line')
        .attr('d', line);

    lchart.append('path')
        .datum(lostBattles)
        .attr('class', 'line')
        .attr('d', line);

    lchart.append('path')
        .datum(civilBattles)
        .attr('class', 'line')
        .attr('d', line);
}

export default {
    populateChart: populateChart
}