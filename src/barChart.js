const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var container, barChart, xScale, yScale, xAxis, yAxis, groups, tooltip, legend;

class StackedChart {
  constructor() {
    this.battles = []
    this.setup()
  }

  setBattles(battles) {
    this.battles = battles
  }

  setup() {
    container = d3.select("#bar_chart_container")
        .append("div")
        // Container class to make it responsive.
        .classed("svg-container", true);

    barChart = container.append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width + " " + height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true);

    drawBorders();
  }

  drawChart() {
    //Process given battles
    var barData = makeDataset(this.battles);

    //sample colors
    var colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];

    //Axis scales and axis
    xScale = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.1)
        .domain(barData.map(function(d) { return d.attack; }));

    yScale = d3.scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, d3.max(barData, function(d) { return d.total; } )]);


    xAxis = barChart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
        .call(d3.axisBottom(xScale));

    yAxis = barChart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margin.bottom + ', 0)')
        .call(d3.axisLeft(yScale));

    //Split our dataset in layers
    var stack = d3.stack()
                  .keys(['won', 'lost', 'civil', 'uncertain']);

    var dataset = stack(barData);
    console.log(dataset);

    groups = barChart.selectAll('g.layer')
                         .data(dataset)
                         .enter()
                         .append('g')
                          .attr('class', 'layer')
                          .attr('fill', function(d, i) {
                            return colors[i];
                          });

    groups.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
          .attr("class", "bar")
          .attr('x', function(d) { return xScale(d.data.attack); })
          .attr('y', function(d) { return yScale(d[1]); })
          .attr("width", xScale.bandwidth())
          .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
          .on('mouseover', function(d) {
            tooltip.select('text').text(d[1] - d[0]);
            tooltip.style('display', null);
          })
          .on('mousemove', function() {
            const xPosition = d3.mouse(this)[0] - 20;
            const yPosition = d3.mouse(this)[1] - 25;
            tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
          })
          .on('mouseout', function() {
            tooltip.style('display', 'none');
          });

    //tooltip to show categories details (We should modularize it ?)
    tooltip = barChart.append('g')
                          .style('display', 'none');

    tooltip.append('rect')
            .attr('width', 30)
            .attr('height', 20)
            .attr('fill', 'white')
           .style('opacity', 0.5);

    tooltip.append('text')
            .attr('x', 15)
            .attr('y', 10)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
           .style('text-anchor', 'middle');

    setupLegend(colors);
  }

  notifyDataChanged() {
    this.drawChart();
  }
}

function drawBorders() {
  barChart.append("rect")
      .classed("rect_b", true)
      .attr("width", width)
      .attr("height", height);
}

function makeDataset(battles) {
  var dataset = initDataset();

  battles.forEach(function(d) {
    if(d.naval == 'y' && d.outcome != "") {
      dataset['naval'][d.outcome] += 1;

      if(d.civil == 'y')
        dataset['civil'][d.outcome] += 1;
      else if(d.sacks == 'y')
        dataset['sacks'][d.outcome] += 1;
      else if(d.sieges == 'y')
        dataset['sieges'][d.outcome] += 1;
    } else if(d.outcome != ""){
      dataset['ground'][d.outcome] += 1;

      if(d.civil == 'y')
        dataset['civil'][d.outcome] += 1;
      else if(d.sacks == 'y')
        dataset['sacks'][d.outcome] += 1;
      else if(d.sieges == 'y')
        dataset['sieges'][d.outcome] += 1;
    }
  });

  //console.log(dataset);

  var barData = [];
  const keys = Object.keys(dataset);

  for(var i = 0; i < keys.length; i++) {
    var curr = dataset[keys[i]];
    var total = Object.values(curr).reduce((a,b) => a + b, 0);

    barData.push({ 'attack': keys[i], 'won': curr['W'], 'lost': curr['L'], 'civil': curr['C'], 'uncertain': curr['-'], 'total': total });
  }

  console.log(barData);

  return barData;
}

function initDataset() {
  var dataset = {};
  const keys = ['naval', 'ground', 'civil', 'sacks', 'sieges'];
  const status = ['W', 'L', 'C', '-'];

  for(var i = 0; i < keys.length; i++) {
    dataset[keys[i]] = [];

    for(var j = 0; j < status.length; j++)
      dataset[keys[i]][status[j]] = 0;
  }

  return dataset;
}

function setupLegend(colors) {
  legend = barChart.append("svg")
                     .attr("width", 150)
                     .attr("height", 85)
                     .attr('x', 410)
                     .attr('y', 30);

 legend.append("rect")
       .classed("rect_b", true)
         .attr("width", 150)
         .attr("height", 85);

 legend.selectAll('circle')
       .data(colors)
       .enter()
       .append('circle')
         .attr('cx', 30)
         .attr('cy', function(d, i) {
           return 20 + i * 15;
         })
         .attr('r', 5)
         .attr('fill', function(d) { return d; });

 legend.selectAll('text')
       .data(colors)
       .enter()
       .append('text')
         .attr('x', 50)
         .attr('y', function(d, i) {
           return 20 + i * 15;
         })
         .text(function(d, i) {
             switch(i) {
               case 0: return 'Won';
               case 1: return 'Lost';
               case 2: return 'Civil';
               case 3: return 'Uncertain';
             }
         })
         .style('alignment-baseline', 'middle');
}


export default new StackedChart()
