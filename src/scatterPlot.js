const d3 = require('d3')

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var container, scatterplot, brush, clip, xScale, yScale, xAxis, yAxis, points;

class ScatterPlot {
  constructor() {
    //for testing purpose
    this.battles = [{x: 5, y: 4}, {x:10, y: 2.5}, {x: 20, y: 12},
                    {x: 1.2, y:3.3}, {x:7.5, y: 2.3}, {x:12, y:5.5}]
    this.setup()
  }

  setBattles(battles) {
    this.battles = battles
  }

  setup() {
    container = d3.select('#scatterplot_container')
                  .append("div")
                  // Container class to make it responsive.
                  .classed("svg-container", true);

    scatterplot = container.append("svg")
        // Responsive SVG needs these 2 attributes and no width and height attr.
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height)
        // Class to make it responsive.
        .classed("svg-content-responsive", true);

    drawBorders()

    brush = d3.brush()
        .extent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .on('start brush end', () => brushed());

    setupClip();
  }

  notifyDataChanged() {
    this.clear();
    this.drawChart();
  }

  clear() {
    scatterplot.selectAll('*').remove();
    drawBorders();
  }

  drawChart() {
    //X and Y scales
    xScale = d3.scaleLinear()
               .domain([0, d3.max(this.battles, function(d) { return d.x; })])
               .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
               .domain([0, d3.max(this.battles, function(d) { return d.x; })])
               .range([height - margin.bottom, margin.top]);

    //X and Y axis
    xAxis = scatterplot.append('g')
                        .attr('class', 'x-axis')
                        .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
                        .call(d3.axisBottom(xScale));

    yAxis = scatterplot.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.bottom + ', 0)')
        .call(d3.axisLeft(yScale));

    //populate plot
    points = scatterplot.append('g')
                          .attr('class', 'brush')
                        .call(brush);

    points.append('g')
          .selectAll('.point')
          .data(this.battles)
          .enter()
          .append('circle')
            .attr('class', 'point')
            .attr('r', 6)
            .attr('cx', function(d) {
              return xScale(d.x);
            })
            .attr('cy', function(d) {
              return yScale(d.y);
            })
            .attr('fill', '#159914');
  }
}

function setupClip() {
  clip = scatterplot.append('defs')
                    .append('svg:clipPath')
                      .attr('id', 'clip')
                    .append('svg:rect')
                      .attr('width', width - margin.left - margin.right)
                      .attr('height', height - margin.top - margin.bottom)
                      .attr('x', margin.left)
                      .attr('y', margin.top);
}

function drawBorders() {
  scatterplot.append("rect")
             .classed("rect_b", true)
              .attr("width", width)
              .attr("height", height);
}

function brushed() {
    var selection = d3.event.selection;
    // To-Do : implement brushing on scatter plot
    if (selection) {
      points.selectAll('.point')
            .each(function(d) {
              var cx = d3.select(this).attr('cx');
              var cy = d3.select(this).attr('cy');

              //Check if the point is inside the brushed area
              var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                  cy >= selection[0][1] && cy <= selection[1][1]);

              if (isBrushed) {
                d3.select(this)
                    .attr('stroke-width', 0.5)
                    .attr('stroke', 'black')
                    .attr('fill', '#996714');
              } else {
                d3.select(this)
                    .attr('stroke-width', 0)
                    .attr('fill', '#159914');
              }
            });
    }
}

export default new ScatterPlot()
