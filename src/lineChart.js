const d3 = require('d3');


var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var isCumulative;
var zoomSelection; //use this when drawing chart
var xScale, yScale, xAxis, yAxis, line, path, container, lchart, brush, clip;

class LineChart {
    constructor() {
        this.battles = []
        this.setup()
    }

    setBattles(battles) {
        this.battles = battles
    }

    setup() {
        container = d3.select("#line_chart_container")
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true);

        lchart = container.append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width + " " + height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true);

        drawBorders();

        brush = d3.brushX()
            .extent([
                [margin.left, margin.top],
                [width - margin.right, height - margin.bottom]
            ])
            .on('end', brushend);

        setupCLip();
    }

    drawCumulativeChart() {
        isCumulative = true
        var wonBattles = this.battles.filter(function(d) { return d.outcome == 'W'; });
        var lostBattles = this.battles.filter(function(d) { return d.outcome == 'L'; });

        //Axis scales
        xScale = d3.scaleLinear()
            .domain([d3.min(this.battles, function(d) { return +d.year; }), d3.max(this.battles, function(d) { return +d.year; })])
            .range([margin.left, width - margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max([0, wonBattles.length, lostBattles.length]) + 1])
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
        var self = this
        lchart.on('dblclick', function() {
            xScale.domain([d3.min(self.battles, function(d) { return +d.year; }), d3.max(self.battles, function(d) { return +d.year; })]);
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

    drawChart() {
        isCumulative = false
        var wonBattles = this.battles.filter(function(d) { return d.outcome == 'W'; });
        var lostBattles = this.battles.filter(function(d) { return d.outcome == 'L'; });

        var won = [],
            lost = [];
        var centuries = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
        centuries.forEach(x => won.push({ "x": x, "y": 0 }));
        centuries.forEach(x => lost.push({ "x": x, "y": 0 }));

        var wonBins = wonBattles.map(x => getCentury(+x.year));
        var lostBins = lostBattles.map(x => getCentury(+x.year));

        won.forEach(o => o.y = wonBins.filter(d => d == o.x).length);
        lost.forEach(o => o.y = lostBins.filter(d => d == o.x).length);

        //Axis scales
        xScale = d3.scaleLinear()
            .domain([-6, 6])
            .range([margin.left, width - margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max([1, d3.max(won.map(w => w.y)), d3.max(lost.map(l => l.y))])])
            .range([height - margin.bottom, margin.top]);

        //x axis and lines
        line = lchart.append('g')
            .attr('clip-path', 'url(#clip)');

        path = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveMonotoneX);

        line.append('path')
            .datum(won)
            .attr('class', 'line')
            .attr('d', path);

        line.append('path')
            .datum(lost)
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
        var self = this
        lchart.on('dblclick', function() {
          xScale.domain([-6, 6]);
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

    notifyDataChanged() {
        this.clear()
        if (isCumulative) this.drawCumulativeChart()
        else this.drawChart()
    }

    clear() {
        lchart.selectAll("*").remove();
        drawBorders();
        setupCLip();
    }
}

function drawBorders() {
    lchart.append("rect")
        .classed("rect_b", true)
        .attr("width", width)
        .attr("height", height);
}

//Clip path in order to cut out everything out the chart
function setupCLip() {
    clip = lchart.append('defs')
        .append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('x', margin.left)
        .attr('y', margin.top);
}

//todo: don't loose focus when data changes
function brushend() {
    var selection = d3.event.selection;

    if (selection) {
        //Updating scales
        xScale.domain([xScale.invert(selection[0]), xScale.invert(selection[1])]);
        line.select('.brush').call(brush.move, null);

        zooming();
    }

    zoomSelection = selection

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

function getCentury(y) {
    if (y > 0) return Math.floor(y / 100) + 1;
    return Math.floor(y / 100);
}

export default new LineChart()
