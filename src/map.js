const d3 = require('d3');

var svg_width = 800,
    svg_height = 600;

var svg = d3.select('#map_container')
            .append('svg')
              .attr('width', svg_width)
              .attr('height', svg_height)
              .attr('fill', 'green')
              .style('border', 25);

//Setting up brush's area
var brush = d3.brush()
              .extent([[0, 0], [svg_width, svg_height]])
                .on('start brush', brushed)
                .on('end', brushend);

var markerGroup = svg.append('g')
                      .attr('class', 'brush')
                     .call(brush);

svg.select('g.brush')
   .select('rect.overlay')
    .style('visibility', 'hidden');

var projection = d3.geoMercator()
                   .translate([svg_width / 4, svg_height + svg_height / 4])
                   .scale(600)
                   .precision(10);

var path = d3.geoPath()
             .projection(projection);

function populateMap(map) {
  //console.log(map.features);

  svg.selectAll('path')
     .data(map.features)
     .enter()
     .append('path')
      .attr('class', 'state')
      .attr('id', function(d) {
        return d.properties['OBJECTID'];
      })
      .attr('d', path);
}


function addMarkers(places) {
  markerGroup.selectAll('circle')
             .data(places)
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
             .style('visibility', 'hidden');
}

function brushed() {
  var selection = d3.event.selection;
  markerGroup.selectAll('circle')
             .style('visibility', function(d) {
               var cx = d3.select(this).attr('cx');
               var cy = d3.select(this).attr('cy');
               //Check if the point is inside the brushed area
               var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                  cy >= selection[0][1] && cy <= selection[1][1]);

              if(isBrushed)
                return 'visible';
              else
                return 'hidden';
             });
}

function brushend() {
  if(d3.event.selection) {
    var selection = d3.event.selection;
    markerGroup.selectAll('circle')
               .style('visibility', function(d) {
                 var cx = d3.select(this).attr('cx');
                 var cy = d3.select(this).attr('cy');
                 //Check if the point is inside the brushed area
                 var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                    cy >= selection[0][1] && cy <= selection[1][1]);

                if(isBrushed)
                    return 'visible';
                 else
                    return 'hidden';
               });
  }
}

export default {
  populateMap : populateMap,
  addMarkers : addMarkers
}
