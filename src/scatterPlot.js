const d3 = require('d3')
import BorderedChart from './borderedChart'
import controller from './controller'

var xScale, yScale, points

class ScatterPlot extends BorderedChart {
    constructor() {
        super()
            //for testing purpose
        this.battles = [{ x: 5, y: 4 }, { x: 10, y: 2.5 }, { x: 20, y: 12 },
            { x: 1.2, y: 3.3 }, { x: 7.5, y: 2.3 }, { x: 12, y: 5.5 }
        ]
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
            .domain([0, d3.max(this.battles, function(d) { return d.x; })])
            .range([this.margin.left, this.width - this.margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max(this.battles, function(d) { return d.x; })])
            .range([this.height - this.margin.bottom, this.margin.top]);

        //X and Y axis
        this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + (this.height - this.margin.bottom) + ')')
            .call(d3.axisBottom(xScale));

        this.chart.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(yScale));

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
                return xScale(d.x);
            })
            .attr('cy', function(d) {
                return yScale(d.y);
            })
            .attr('fill', '#159914');

        controller.applyDarkMode(controller.darkmode);
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
}
export default new ScatterPlot()
