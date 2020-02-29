const d3 = require('d3');

var width = 600
var height = 400

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

    if (selection) {
        markerGroup.selectAll('circle')
            .style('visibility', function(_d) {
                var cx = d3.select(this).attr('cx');
                var cy = d3.select(this).attr('cy');
                //Check if the point is inside the brushed area
                var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                    cy >= selection[0][1] && cy <= selection[1][1]);

                return isBrushed ? 'visible' : 'hidden';
            });
    } else markerGroup.selectAll('circle')
        .style('visibility', "visible");
}

export default {
    populateMap: populateMap,
    addMarkers: addMarkers
}