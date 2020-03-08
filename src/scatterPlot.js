const d3 = require('d3')
import BorderedChart from './borderedChart'
import controller from './controller'

var xScale, yScale, xAxis, yAxis, points

class ScatterPlot extends BorderedChart {
    constructor() {
        super()
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
            .domain([-0.5, 1.1 * d3.max(this.battles, function(d) { return d.y1 })])
            .range([this.margin.left, this.width - this.margin.right]);

        yScale = d3.scaleLinear()
            .domain([-1.5, 1.1 * d3.max(this.battles, function(d) { return d.y2 })])
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
            .attr('class', 'point')
            .attr('r', 6)
            .attr('cx', function(d) {
                return xScale(d.y1)
            })
            .attr('cy', function(d) {
                return yScale(d.y2)
            })
            .attr('fill', '#159914');

        this.applyThemeChanged(controller.darkmode, controller.blindsafe);
    }

    onBrush() {
        var selection = d3.event.selection;
        // To-Do : implement brushing on scatter plot
        if (selection) {
            points.selectAll('.point')
                .each(function() {
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

    applyBlindSafe(darkmode, blindsafe) {
        //To-Do : implements actions !
    }

    applyThemeChanged(darkmode, blindsafe) {
        if (darkmode) {
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
}
export default new ScatterPlot()