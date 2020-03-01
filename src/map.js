const d3 = require('d3');

var width = 600
var height = 400

//Setting up zoom feature
/*
var zoom = d3.zoom()
             .scaleExtent([1, 4])
             .translateExtent([[0, 0], [width, height]])
             .extent([[0, 0], [width, height]])
             .on('zoom', zoomed);
*/

var mapSvg = d3.select("#map_container")
    .append("div")
    // Container class to make it responsive.
    .classed("svg-container", true)
    .append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    // Class to make it responsive.
    .classed("svg-content-responsive", true);

mapSvg.append("rect")
    .classed("rect_b", true)
    .attr("width", width)
    .attr("height", height)

var legend = setupLegend();

// create a Geo Projection
var projection = d3.geoMercator()
    .translate([120, 600])
    .scale(500)
    .precision(10);

var path = d3.geoPath()
    .projection(projection);

//Setting up brush's area
var brush = d3.brush()
    .extent([
        [0, 0],
        [width, height]
    ]).on('start brush end', brushed);

function populateMap(map) {
    //console.log(map.features);

    mapSvg.selectAll('path')
        .data(map.features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('id', function(d) {
            return d.properties['OBJECTID'];
        })
        .attr('d', path);
}

var markerGroup;

function addMarkers(battles) {
    markerGroup = mapSvg.append('g')
        .attr('class', 'brush')
        .call(brush);

    markerGroup.append('g')
        .selectAll('circle')
        .data(battles)
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

            console.log(d.label);
        })

    .style('visibility', 'visible');
}

function brushed() {
    var selection = d3.event.selection;

    var points = 0;
    var minYear = Infinity;
    var maxYear = -Infinity;

    if (selection) {
        markerGroup.selectAll('circle')
            .style('visibility', function(d) {
                var cx = d3.select(this).attr('cx');
                var cy = d3.select(this).attr('cy');
                //Check if the point is inside the brushed area
                var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                    cy >= selection[0][1] && cy <= selection[1][1]);

                if (isBrushed) {
                    points++;
                    minYear = d3.min([minYear, +d.year]);
                    maxYear = d3.max([maxYear, +d.year]);
                    d3.select(this)
                        .attr('stroke-width', 0.5)
                        .attr('stroke', 'white');

                    legend.select('#battle_label')
                        .text(d.label);
                    legend.select('#battle_year')
                        .text('Year : ' + d.year);
                    legend.select('#battle_coordinate')
                        .text('Coordinate : (' + d.latitude + ',' + d.longitude + ')');
                    legend.select('#battle_outcome')
                        .text('Outcome : ' + d.outcome);
                    return 'visible';
                }
                d3.select(this).attr('stroke-width', 0);
                return 'hidden';
            });
    } else {
        markerGroup.selectAll('circle')
            .style('visibility', "visible");
        resetLegend();
    }
    if (points > 1) {
        resetLegend();
        legend.select('#battle_label')
            .text(points + " battles selected");
        legend.select('#battle_year')
            .text('From ' + parseRoman(minYear) + ' to ' + parseRoman(maxYear));
    }
}

function parseRoman(y) {
    if (y == 0) return 0;
    if (y < 0) return -y + "BC";
    return y + "AD"
}

/*
function zoomed() {
  d3.selectAll('path')
    .attr('transform', d3.event.transform);

  markerGroup.selectAll('circle')
              .attr('transform', d3.event.transform);
}
*/

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

export default {
    populateMap: populateMap,
    addMarkers: addMarkers
}