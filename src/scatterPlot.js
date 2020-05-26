const d3 = require('d3')
import BorderedChart from './borderedChart'
import controller from './controller'

var xScale, yScale, xAxis, yAxis, points, legend

class ScatterPlot extends BorderedChart {
    constructor() {
        super({ width: 500, height: 270 }, { top: 30, bottom: 30, left: 30, right: 120 })
            //for testing purpose
        this.battles = []
    }

    setBattles(battles) {
        this.battles = battles
    }

    notifyDataChanged() {
        this.clear()
        this.drawChart()
    }

    drawChart() {
        //X and Y scales
        xScale = d3.scaleLinear()
            .domain([0, 3])
            .range([this.margin.left, this.width - this.margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, 3])
            .range([this.height - this.margin.bottom, this.margin.top]);

        //X and Y axis
        xAxis = this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + (this.height - this.margin.bottom) + ')')
            .call(d3.axisBottom(xScale))

        yAxis = this.chart.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(yScale))

        //populate plot
        points = this.chart.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        points.append('g')
            .selectAll('.point')
            .data(this.battles)
            .enter()
            .append('circle')
            .attr('class', function(d) {
                if (d.outcome == 'W')
                    return 'won-point';
                else if (d.outcome == 'L')
                    return 'lost-point';
                else if (d.outcome == 'C')
                    return 'civil-point';
                else
                    return 'uncertain-point';
            })
            .attr('r', 6)
            .attr('cx', function(d) {
                return xScale(d.y1)
            })
            .attr('cy', function(d) {
                return yScale(d.y2)
            });

        this.setupLegend()

        this.applyThemeChanged(controller.darkmode, controller.blindsafe);
    }

    onBrush() {
        var selection = d3.event.selection;
        var echo = []
        if (selection) {
            points.selectAll('circle')
                .each(function(d) {
                    var cx = d3.select(this).attr('cx');
                    var cy = d3.select(this).attr('cy');

                    //Check if the point is inside the brushed area
                    var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                        cy >= selection[0][1] && cy <= selection[1][1]);

                    if (isBrushed) {
                        echo.push(+d.id)
                        d3.select(this)
                            .classed('brushed', 'true')
                            .attr('stroke-width', 0.5)
                            .attr('stroke', () => {
                                if (controller.darkmode)
                                    return 'white'
                                return 'black'
                            });
                    } else {
                        d3.select(this)
                            .classed('brushed', false)
                            .attr('stroke-width', 0);
                    }
                })
        }
        controller.setBrushedScatterData(echo)
    }

    applyBlindSafe(darkmode, blindsafe) {
        if (blindsafe) {
            //Update scatter points
            points.selectAll('.won-point')
                .style('fill', '#33a02c');

            points.selectAll('.lost-point')
                .style('fill', '#1f78b4');

            points.selectAll('.civil-point')
                .style('fill', '#b2df8a');

            points.selectAll('.uncertain-point')
                .style('fill', '#a6cee3');

            //Update legend indicators
            legend.selectAll('.won-point')
                .style('fill', '#33a02c');

            legend.selectAll('.lost-point')
                .style('fill', '#1f78b4');

            legend.selectAll('.civil-point')
                .style('fill', '#b2df8a');

            legend.selectAll('.uncertain-point')
                .style('fill', '#a6cee3');
        } else {
            if (darkmode) {
                //Update scatter points
                points.selectAll('.won-point')
                    .style('fill', '#1b9e77');

                points.selectAll('.lost-point')
                    .style('fill', '#d95f02');

                points.selectAll('.civil-point')
                    .style('fill', '#7570b3');

                points.selectAll('.uncertain-point')
                    .style('fill', '#e7298a');

                //Update legend indicators
                legend.selectAll('.won-point')
                    .style('fill', '#1b9e77');

                legend.selectAll('.lost-point')
                    .style('fill', '#d95f02');

                legend.selectAll('.civil-point')
                    .style('fill', '#7570b3');

                legend.selectAll('.uncertain-point')
                    .style('fill', '#e7298a');
            } else {
                //Update scatter points
                points.selectAll('.won-point')
                    .style('fill', '#8dd3c7');

                points.selectAll('.lost-point')
                    .style('fill', '#fb8072');

                points.selectAll('.civil-point')
                    .style('fill', '#ffffb3');

                points.selectAll('.uncertain-point')
                    .style('fill', '#bebada');

                //Update legend indicators
                legend.selectAll('.won-point')
                    .style('fill', '#8dd3c7');

                legend.selectAll('.lost-point')
                    .style('fill', '#fb8072');

                legend.selectAll('.civil-point')
                    .style('fill', '#ffffb3');

                legend.selectAll('.uncertain-point')
                    .style('fill', '#bebada');
            }
        }
    }

    applyThemeChanged(darkmode, blindsafe) {
        if (darkmode) {
            points.selectAll('circle.brushed')
                .attr('stroke', 'white');

            legend.selectAll('text.legend-label')
                .style('fill', '#cccccc');

            //Update axis components
            xAxis.select('path.domain')
                .style('stroke', '#ffffff');

            xAxis.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#ffffff');

            xAxis.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#ffffff');

            yAxis.select('path.domain')
                .style('stroke', '#ffffff');

            yAxis.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#ffffff');

            yAxis.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#ffffff');
        } else {
            points.selectAll('circle.brushed')
                .attr('stroke', 'black ');

            legend.selectAll('text.legend-label')
                .style('fill', '#808080');

            //Update axis components
            xAxis.select('path.domain')
                .style('stroke', '#000000');

            xAxis.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#000000');

            xAxis.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#000000');

            yAxis.select('path.domain')
                .style('stroke', '#000000');

            yAxis.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#000000');

            yAxis.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#000000');
        }
        this.applyBlindSafe(darkmode, blindsafe);
    }

    setupLegend() {
        var civil_flag = controller.filters.civil;
        var labels = ['won', 'lost', 'civil', 'uncertain'].filter(function(d, i) {
            return !(i == 2 && !civil_flag)
        })

        legend = this.chart.append("svg")
            .attr("width", 90)
            .attr("height", 90)
            .attr('x', 380)
            .attr('y', 15)

        legend.selectAll('circle')
            .data(labels)
            .enter()
            .append('circle')
            .attr('class', function(d) {
                return d + '-point';
            })
            .attr('cx', 10)
            .attr('cy', function(_d, i) {
                return 10 + i * 15;
            })
            .attr('r', 5);

        legend.selectAll('text')
            .data(labels)
            .enter()
            .append('text')
            .attr('class', 'legend-label')
            .attr('x', 25)
            .attr('y', function(_, i) {
                return 10 + i * 15;
            })
            .text(d => d)
            .style('alignment-baseline', 'middle')
    }
}
export default new ScatterPlot()
