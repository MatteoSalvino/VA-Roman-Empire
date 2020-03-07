import controller from './controller'
import BorderedChart from './borderedChart';

const d3 = require('d3');

var isBrushing = false,
    brushedArea = undefined

var legend, projection, path, markerGroup

class Map extends BorderedChart {
    constructor() {
        super()
        this.map = []
        this.battles = []
        this.resetPeriod()
    }

    onBindBrush() {
        super.onBindBrush()
        this.brush.extent([
            [0, 0],
            [this.width, this.height]
        ])
    }

    setMap(map) { this.map = map }

    setBattles(battles) { this.battles = battles }

    resetPeriod(min = -Infinity, max = Infinity) {
        this.period = { min: min, max: max }
    }

    onBindView(selector) {
        super.onBindView(selector)

        // create a Geo Projection
        projection = d3.geoMercator()
            .translate([120, 600])
            .scale(500)
            .precision(10)

        path = d3.geoPath()
            .projection(projection)
    }

    notifyDataChanged(redraw = true) {
        if (redraw)
            this.drawChart()
        else this.update()
    }

    drawChart() {
        this.chart.selectAll('path')
            .data(this.map.features)
            .enter()
            .append('path')
            .attr('class', 'state')
            .attr('id', function(d) {
                return d.properties['OBJECTID'];
            })
            .attr('d', path);

        markerGroup = this.chart.append('g')
            .attr('class', 'brush')
            .call(this.brush);

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
            .attr('class', function(d) {
                if (d.outcome == 'W')
                    return 'won';
                else if (d.outcome == 'L')
                    return 'lost';
                else if (d.outcome == 'C')
                    return 'civil';
                else
                    return 'uncertain';
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

        legend = this.setupLegend()

        this.applyThemeChanged(controller.darkmode, controller.blindsafe)
    }

    update() {
        var points = 0

        var self = this
        var minYear = Infinity,
            maxYear = -Infinity
        var selector = isBrushing ? ".brushed" : "circle"
        markerGroup.selectAll(selector)
            .each(function(d) {

                var ok = self.battles.filter(b => b.id == d.id).length > 0
                if (ok && +d.year >= self.period.min && +d.year <= self.period.max) {
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

    onBrush() {
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
                updateLegend(points, minYear, maxYear)
                controller.setBrushedMapData(echo)
            }
        } else {
            isBrushing = false
            markerGroup.selectAll('circle')
                .style('visibility', "visible");
            resetLegend();
            controller.resetBrushedMapData()
        }
    }

    setupLegend() {
        var legend = this.chart.append("svg")
            .attr("width", 200)
            .attr("height", 100)
            .attr('x', 400)
            .attr('y', 10);

        legend.append('text')
            .attr('id', 'battle_label')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 20)
            .attr('font-size', 12)
            .attr('font-weight', 'bold');

        legend.append('text')
            .attr('id', 'battle_year')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 40)
            .attr('font-size', 10);

        legend.append('text')
            .attr('id', 'battle_coordinate')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 60)
            .attr('font-size', 10);

        legend.append('text')
            .attr('id', 'battle_outcome')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 80)
            .attr('font-size', 10);
        return legend;
    }

    applyThemeChanged(darkmode, blindsafe) {
      if (darkmode && !blindsafe) {
        //Update battles on map
        markerGroup.selectAll('circle.won')
            .style('fill', '#1b9e77');

        markerGroup.selectAll('circle.lost')
            .style('fill', '#d95f02');

        markerGroup.selectAll('circle.civil')
            .style('fill', '#7570b3');

        markerGroup.selectAll('circle.uncertain')
            .style('fill', '#e7298a');

        //Update map's paths, svg and legend
        this.chart.selectAll('path.state')
            .style('fill', '#255874')
            .style('stroke', '#737373');

        legend.selectAll('text.legend-label')
                .style('fill', '#cccccc');

      } else if((!darkmode && blindsafe) || (darkmode && blindsafe)) {
        //Update battles on map
        markerGroup.selectAll('circle.won')
            .style('fill', '#33a02c');

        markerGroup.selectAll('circle.lost')
            .style('fill', '#1f78b4');

        markerGroup.selectAll('circle.civil')
            .style('fill', '#b2df8a');

        markerGroup.selectAll('circle.uncertain')
            .style('fill', '#a6cee3');

        if(!darkmode) {
          //Update map's paths, svg and legend
          this.chart.selectAll('path.state')
              .style('fill', '#b1d4e7')
              .style('stroke', '#b3b3b3');

          legend.selectAll('text.legend-label')
                  .style('fill', '#808080');
        } else {
          //Update map's paths, svg and legend
          this.chart.selectAll('path.state')
              .style('fill', '#255874')
              .style('stroke', '#737373');

          legend.selectAll('text.legend-label')
                  .style('fill', '#cccccc');
        }
      } else {
        //!darkmode && !blindsafe

        //Update battles on map
        markerGroup.selectAll('circle.won')
            .style('fill', '#8dd3c7');

        markerGroup.selectAll('circle.lost')
            .style('fill', '#fb8072');

        markerGroup.selectAll('circle.civil')
            .style('fill', '#ffffb3');

        markerGroup.selectAll('circle.uncertain')
            .style('fill', '#bebada');

        //Update map's paths, svg and legend
        this.chart.selectAll('path.state')
              .style('fill', '#b1d4e7')
              .style('stroke', '#b3b3b3');

        legend.selectAll('text.legend-label')
                  .style('fill', '#808080');
      }
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

export default new Map()
