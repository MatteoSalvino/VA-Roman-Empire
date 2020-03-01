const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var container = d3.select("#boxplot_container")
    .append("div")
    // Container class to make it responsive.
    .classed("svg-container", true);

var boxplot = container.append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    // Class to make it responsive.
    .classed("svg-content-responsive", true);

boxplot.append("rect")
    .classed("rect_b", true)
    .attr("width", width)
    .attr("height", height);

function populate(wars) {
    var data = wars.map(function(d) {
        return d.endYear - d.startYear + 1;
    });
    console.log(data);

    // Compute summary statistics used for the box:
    var data_sorted = data.sort(d3.ascending)
    var q1 = d3.quantile(data_sorted, .25)
    var median = d3.quantile(data_sorted, .5)
    var q3 = d3.quantile(data_sorted, .75)
    var interQuantileRange = q3 - q1
    var min = d3.max([d3.min(data), q1 - 1.5 * interQuantileRange])
    var max = d3.min([d3.max(data), q1 + 1.5 * interQuantileRange])

    // Show the Y scale
    var y = d3.scaleLinear()
        .domain([0, 20])
        .range([height - margin.bottom, margin.top]);

    boxplot.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margin.bottom + ', 0)')
        .call(d3.axisLeft(y));

    // a few features for the box
    var center = width / 2
    var boxWidth = 100

    // Show the main vertical line
    boxplot.append("line")
        .attr("x1", center)
        .attr("x2", center)
        .attr("y1", y(min))
        .attr("y2", y(max))
        .attr("stroke", "black")

    // Show the box
    boxplot.append("rect")
        .attr("x", center - boxWidth / 2)
        .attr("y", y(q3))
        .attr("height", (y(q1) - y(q3)))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", "#69b3a2")

    // show median, min and max horizontal lines
    boxplot
        .selectAll("toto")
        .data([min, median, max])
        .enter()
        .append("line")
        .attr("x1", center - boxWidth / 2)
        .attr("x2", center + boxWidth / 2)
        .attr("y1", function(d) { return (y(d)) })
        .attr("y2", function(d) { return (y(d)) })
        .attr("stroke", "black")
}

export default {
    populate: populate
}