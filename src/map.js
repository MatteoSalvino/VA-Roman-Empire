import controller from './controller'

const d3 = require('d3');

var width = 600
var height = 400
var isBrushing = false,
    brushedArea = undefined

var mapSvg, legend, projection, path, brush, markerGroup

class Map {
    constructor() {
        this.map = []
        this.battles = []
        this.resetPeriod()
        this.setup()
    }

    setMap(map) { this.map = map }

    setBattles(battles) { this.battles = battles }

    resetPeriod(min = -Infinity, max = Infinity) {
        this.period = { min: min, max: max }
    }

    setup() {
        mapSvg = d3.select("#map_container")
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true)
            .append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width + " " + height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true);

        drawBorders();

        legend = setupLegend();

        // create a Geo Projection
        projection = d3.geoMercator()
            .translate([120, 600])
            .scale(500)
            .precision(10);

        path = d3.geoPath()
            .projection(projection);

        //Setting up brush's area
        brush = d3.brush()
            .extent([
                [0, 0],
                [width, height]
            ]).on('start brush end', brushed);
    }

    notifyDataChanged(redraw = true) {
        if (redraw)
            this.drawChart()
        else this.update()
    }

    drawChart() {
        mapSvg.selectAll('path')
            .data(this.map.features)
            .enter()
            .append('path')
            .attr('class', 'state')
            .attr('id', function(d) {
                return d.properties['OBJECTID'];
            })
            .attr('d', path);

        markerGroup = mapSvg.append('g')
            .attr('class', 'brush')
            .call(brush);

        markerGroup.append('g')
            .selectAll('circle')
            .data(this.battles)
            .enter()
            .append('circle')
            .attr('cx', function(d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr('cy', function(d) {
                return projection([d.longitude, d.latitude])[1];
            })
            .attr('r', 4)
            .attr('fill', 'blue')
            .attr('pointer-events', 'all')
            .on('click', function(d) {
                d3.selectAll('.selected')
                    .classed('selected', false);

                d3.select(this)
                    .classed('selected', true);
                setLabel(d)
            })
            .style('visibility', 'visible');
    }

    update() {
        var points = 0

        var self = this
        var minYear = Infinity,
            maxYear = -Infinity
        var selector = isBrushing ? ".brushed" : "circle"
        markerGroup.selectAll(selector)
            .each(function(d) {
                if (+d.year >= self.period.min && +d.year <= self.period.max) {
                    points++
                    minYear = d3.min([minYear, +d.year])
                    maxYear = d3.max([maxYear, +d.year])
                    d3.select(this)
                        .style('visibility', 'visible')
                        .attr('stroke-width', 0.5)
                        .attr('stroke', 'white');
                    setLabel(d);
                } else d3.select(this).style('visibility', 'hidden')
            });

        updateLegend(points, minYear, maxYear)
    }
}

function updateLegend(numBattles, min, max) {
    if (numBattles == 1) return;

    resetLegend();
    if (numBattles != 0) {
        legend.select('#battle_label')
            .text(numBattles + " battles selected");
        legend.select('#battle_year')
            .text('From ' + parseRoman(Math.trunc(min)) + ' to ' + parseRoman(Math.trunc(max)));
    }
}

function drawBorders() {
    mapSvg.append("rect")
        .classed("rect_b", true)
        .attr("width", width)
        .attr("height", height);
}

//Setting up zoom feature
/*
var zoom = d3.zoom()
             .scaleExtent([1, 4])
             .translateExtent([[0, 0], [width, height]])
             .extent([[0, 0], [width, height]])
             .on('zoom', zoomed);

function zoomed() {
  d3.selectAll('path')
      .attr('transform', d3.event.transform);

  markerGroup.selectAll('circle')
               .attr('transform', d3.event.transform);
}
*/

function brushed() {
    var selection = d3.event.selection;

    var isClick = JSON.stringify(brushedArea) == JSON.stringify(selection)
    brushedArea = selection

    var points = 0;
    var minYear = Infinity;
    var maxYear = -Infinity;

    var echo = []
    if (selection) {
        if (!isClick) {
            isBrushing = true
            markerGroup.selectAll('circle')
                .style('visibility', function(d) {
                    var cx = d3.select(this).attr('cx');
                    var cy = d3.select(this).attr('cy');
                    //Check if the point is inside the brushed area
                    var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                        cy >= selection[0][1] && cy <= selection[1][1]);

                    if (isBrushed) {
                        echo.push(d)
                        points++;
                        minYear = d3.min([minYear, +d.year]);
                        maxYear = d3.max([maxYear, +d.year]);
                        d3.select(this)
                            .classed('brushed', true)
                            .attr('stroke-width', 0.5)
                            .attr('stroke', 'white');

                        setLabel(d);
                        return 'visible';
                    }
                    d3.select(this).attr('stroke-width', 0).classed('brushed', false);
                    return 'hidden';
                });
            controller.setBrushedMapData(echo)
        }
    } else {
        isBrushing = false
        markerGroup.selectAll('circle')
            .style('visibility', "visible");
        resetLegend();
        controller.resetBrushedMapData()
    }
    updateLegend(points, minYear, maxYear)
}

function parseRoman(y) {
    if (y == 0) return 0;
    if (y < 0) return -y + "BC";
    return y + "AD"
}

function setLabel(d) {
    legend.select('#battle_label')
        .text(d.label);
    legend.select('#battle_year')
        .text('Year: ' + parseRoman(d.year));
    legend.select('#battle_coordinate')
        .text('Coordinates: (' + d.latitude + ',' + d.longitude + ')');
    legend.select('#battle_outcome')
        .text('Outcome: ' + d.outcome);
}

function resetLegend() {
    legend.select('#battle_label')
        .text('');
    legend.select('#battle_year')
        .text('');
    legend.select('#battle_coordinate')
        .text('');
    legend.select('#battle_outcome')
        .text('');
}

function setupLegend() {
    var legend = mapSvg.append("svg")
        .attr("width", 200)
        .attr("height", 100)
        .attr('x', 400)
        .attr('y', 10);

    legend.append('text')
        .attr('id', 'battle_label')
        .attr('x', 5)
        .attr('y', 20)
        .attr('font-size', 12)
        .attr('font-weight', 'bold');

    legend.append('text')
        .attr('id', 'battle_year')
        .attr('x', 5)
        .attr('y', 40)
        .attr('font-size', 10);

    legend.append('text')
        .attr('id', 'battle_coordinate')
        .attr('x', 5)
        .attr('y', 60)
        .attr('font-size', 10);

    legend.append('text')
        .attr('id', 'battle_outcome')
        .attr('x', 5)
        .attr('y', 80)
        .attr('font-size', 10);
    return legend;
}

export default new Map()