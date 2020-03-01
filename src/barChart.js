const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var container = d3.select("#bar_chart_container")
    .append("div")
    // Container class to make it responsive.
    .classed("svg-container", true);

var barChart = container.append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    // Class to make it responsive.
    .classed("svg-content-responsive", true);

barChart.append("rect")
    .classed("rect_b", true)
    .attr("width", width)
    .attr("height", height);

function populateChart(battles) {
    var naval = battles.filter(function(d) { return d.naval == 'y'; }).length;
    var ground = battles.filter(function(d) { return d.naval != 'y'; }).length;
    var civil = battles.filter(function(d) { return d.civil == 'y'; }).length;
    var sieges = battles.filter(function(d) { return d.siege == 'y'; }).length;
    var sacks = battles.filter(function(d) { return d.sack == 'y'; }).length;

    var barData = [
        { "c": "Ground", "n": ground },
        { "c": "Naval", "n": naval },
        { "c": "Civil", "n": civil },
        { "c": "Sacks", "n": sacks },
        { "c": "Sieges", "n": sieges },
    ];

    console.log(barData);

    //Axis scales and line
    // set the ranges
    var x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.1)
        .domain(barData.map(function(d) { return d.c; }));
    var y = d3.scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, d3.max(barData, function(d) { return d.n; })]);


    barChart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
        .call(d3.axisBottom(x));

    barChart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margin.bottom + ', 0)')
        .call(d3.axisLeft(y));

    barChart.selectAll(".bar")
        .data(barData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.c); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.n); })
        .attr("height", function(d) { return height - margin.bottom - y(d.n); });
}

export default {
    populateChart: populateChart
}