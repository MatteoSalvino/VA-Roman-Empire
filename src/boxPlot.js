const d3 = require('d3');
import BorderedChart from './borderedChart'
import controller from './controller'

class BoxPlot extends BorderedChart {
    constructor() {
        super()
    }

    setWars(wars) {
        this.wars = wars
    }

    notifyDataChanged() {
        this.clear()
        this.drawChart()
    }

    drawChart() {
        var data = this.wars.map(w => w.endYear - w.startYear + 1)

        // Compute summary statistics used for the box:
        var data_sorted = data.sort(d3.ascending)
        var q1 = d3.quantile(data_sorted, .25)
        var median = d3.quantile(data_sorted, .5)
        var q3 = d3.quantile(data_sorted, .75)
        var interQuantileRange = q3 - q1
        var min = d3.max([d3.min(data), q1 - 1.5 * interQuantileRange])
        var max = d3.min([d3.max(data), q1 + 1.5 * interQuantileRange])

        // Show the Y scale
        var y = d3.scaleLinear()
            .domain([0, d3.max([10, Math.floor(max * 1.2)])])
            .range([this.height - this.margin.bottom, this.margin.top]);

        this.chart.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(y));

        // a few features for the box
        var center = this.width / 2
        var boxWidth = 100

        // Show the main vertical line
        this.chart.append("line")
            .attr('class', 'box-stroke')
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", "black")

        // Show the box
        this.chart.append("rect")
            .attr('class', 'box-area')
            .attr("x", center - boxWidth / 2)
            .attr("y", y(q3))
            .attr("height", function() {
                if (q1 != undefined && q3 != undefined) return (y(q1) - y(q3));
            })
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .style("fill", "#69b3a2")

        // show median, min and max horizontal lines
        this.chart
            .selectAll("toto")
            .data([min, median, max])
            .enter()
            .append("line")
            .attr('class', 'box-stroke')
            .attr("x1", center - boxWidth / 2)
            .attr("x2", center + boxWidth / 2)
            .attr("y1", function(d) { return (y(d)) })
            .attr("y2", function(d) { return (y(d)) })
            .attr("stroke", "black")

        controller.applyDarkMode(controller.darkmode);
    }
}

export default new BoxPlot()
