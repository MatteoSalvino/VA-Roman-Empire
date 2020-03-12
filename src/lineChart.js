import controller from './controller'
import BorderedChart from './borderedChart'
const d3 = require('d3')

var xScale, yScale, xAxis, yAxis, line, path, legend, centuryBtn, cumulativeBtn

class LineChart extends BorderedChart {
    constructor() {
        super({ width: 600, height: 400 }, { top: 60, bottom: 30, left: 30, right: 30 })
        this.battles = []
    }

    setBattles(battles) {
        this.battles = battles
    }

    onBindBrush() {
        this.brush = d3.brushX()
            .extent([
                [this.margin.left, this.margin.top],
                [this.width - this.margin.right, this.height - this.margin.bottom]
            ])
            .on('end', () => brushend(this, this.isCumulative));
    }

    drawCumulativeChart() {
        //clean previous selections
        controller.resetBrushedLineData()

        this.isCumulative = true
        var wonBattles = this.battles.filter(function(d) { return d.outcome == 'W'; });
        var lostBattles = this.battles.filter(function(d) { return d.outcome == 'L'; });

        //Axis scales
        xScale = d3.scaleLinear()
            .domain([d3.min(this.battles, function(d) { return +d.year; }), d3.max(this.battles, function(d) { return +d.year; })])
            .range([this.margin.left, this.width - this.margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max([0, wonBattles.length, lostBattles.length]) + 1])
            .range([this.height - this.margin.bottom, this.margin.top]);


        //x axis and lines
        line = this.chart.append('g')
            .attr('clip-path', 'url(#clip)');

        path = d3.line()
            .x(function(d) {
                return xScale(+d.year);
            })
            .y(function(_d, i) {
                return yScale(i);
            })
            .curve(d3.curveMonotoneX);

        line.append('path')
            .datum(wonBattles)
            .attr('class', 'won-line')
            .attr('d', path);

        line.append('path')
            .datum(lostBattles)
            .attr('class', 'lost-line')
            .attr('d', path);

        line.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        xAxis = this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + (this.height - this.margin.bottom) + ')')
            .call(d3.axisBottom(xScale)
                .tickFormat(function(d) {
                    if (d == 0) return 0;
                    if (d < 0) return -d + "BC";
                    return d + "AD"
                }));

        yAxis = this.chart.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(yScale));

        //Legend
        this.setupLegend()
        cumulativeBtn.style("fill", "#2a6789")
        cumulativeBtn.style("stroke", "#b1d4e7")

        //Reset zoom
        var self = this
        this.chart.on('dblclick', function() {
            xScale.domain([d3.min(self.battles, function(d) { return +d.year; }), d3.max(self.battles, function(d) { return +d.year; })]);
            xAxis.transition().duration(1500).call(d3.axisBottom(xScale)
                .tickFormat(function(d) {
                    if (d == 0) return 0;
                    if (d < 0) return -d + "BC";
                    return d + "AD"
                }));

            line.selectAll('.won-line')
                .transition()
                .duration(1500)
                .attr('d', path);

            line.selectAll('.lost-line')
                .transition()
                .duration(1500)
                .attr('d', path);

            //reflects changes on map
            controller.resetBrushedLineData();
            self.applyThemeChanged(controller.darkmode, controller.blindsafe)
        });
        this.applyThemeChanged(controller.darkmode, controller.blindsafe)
    }

    drawChart() {
        //clean previous selections
        controller.resetBrushedLineData();

        this.isCumulative = false
        var wonBattles = this.battles.filter(function(d) { return d.outcome == 'W'; });
        var lostBattles = this.battles.filter(function(d) { return d.outcome == 'L'; });

        var won = [],
            lost = [];
        var centuries = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
        centuries.forEach(x => won.push({ "x": x, "y": 0 }));
        centuries.forEach(x => lost.push({ "x": x, "y": 0 }));

        var wonBins = wonBattles.map(x => getCentury(+x.year));
        var lostBins = lostBattles.map(x => getCentury(+x.year));

        won.forEach(o => o.y = wonBins.filter(d => d == o.x).length);
        lost.forEach(o => o.y = lostBins.filter(d => d == o.x).length);

        //Axis scales
        xScale = d3.scaleLinear()
            .domain([-6, 6])
            .range([this.margin.left, this.width - this.margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max([0, d3.max(won.map(w => w.y)), d3.max(lost.map(l => l.y))]) + 1])
            .range([this.height - this.margin.bottom, this.margin.top]);

        //x axis and lines
        line = this.chart.append('g')
            .attr('clip-path', 'url(#clip)');

        path = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveMonotoneX);

        line.append('path')
            .datum(won)
            .attr('class', 'won-line')
            .attr('d', path);

        line.append('path')
            .datum(lost)
            .attr('class', 'lost-line')
            .attr('d', path);

        line.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        xAxis = this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + (this.height - this.margin.bottom) + ')')
            .call(d3.axisBottom(xScale)
                .tickFormat(function(d) {
                    if (d == 0) return 0;
                    if (d < 0) return -d + "BC";
                    return d + "AD"
                }));

        yAxis = this.chart.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(yScale));

        this.setupLegend()

        centuryBtn.style("fill", "#2a6789")
        centuryBtn.style("stroke", "#b1d4e7")

        //Reset zoom
        var self = this
        this.chart.on('dblclick', function() {
            xScale.domain([-6, 6]);
            xAxis.transition().duration(1500).call(d3.axisBottom(xScale)
                .tickFormat(function(d) {
                    if (d == 0) return 0;
                    if (d < 0) return -d + "BC";
                    return d + "AD"
                }));

            line.selectAll('.won-line')
                .transition()
                .duration(1500)
                .attr('d', path);

            line.selectAll('.lost-line')
                .transition()
                .duration(1500)
                .attr('d', path);

            //reflect changes on map
            controller.resetBrushedLineData();
            self.applyThemeChanged(controller.darkmode, controller.blindsafe)
        });
        this.applyThemeChanged(controller.darkmode, controller.blindsafe)
    }

    //Note: this always redraws from scratch the chart
    notifyDataChanged() {
        this.clear()
        if (this.isCumulative) this.drawCumulativeChart()
        else this.drawChart()
    }

    //so sketti
    setupButtons() {

        var self = this
        centuryBtn = this.chart
            .append('rect')
            .attr("x", 400)
            .attr("width", "90")
            .attr("height", "24")
            .attr("fill", "#b1d4e7")
            .attr('class', 'btn btn-primary')
            .on("click", function() {
                self.clear()
                self.drawChart()
                controller.resetBrushedLineData()
            })

        cumulativeBtn = this.chart
            .append('rect')
            .attr("x", 492)
            .attr("fill", "#b1d4e7")
            .attr("width", "90")
            .attr("height", "24")
            .attr('class', 'btn btn-primary')
            .on("click", function() {
                self.clear()
                self.drawCumulativeChart()
                controller.resetBrushedLineData()
            })

        this.chart
            .append('text')
            .attr('x', 410)
            .attr('y', 12)
            .text("by century")
            .attr("fill", "white")
            .style('alignment-baseline', 'middle')

        this.chart
            .append('text')
            .attr('x', 498)
            .attr('y', 12)
            .attr('class', 'cumulative-label')
            .text("cumulative")
            .attr("fill", "white")
            .style('alignment-baseline', 'middle')
    }

    setupLegend() {
        var labels = ['won battles', 'lost battles'];

        legend = this.chart.append("svg")
            .attr("width", 150)
            .attr("height", 55)
            .attr('x', 0)
            .attr('y', 0)

        legend.selectAll('circle')
            .data(labels)
            .enter()
            .append('circle')
            .attr('class', function(_d, i) {
                if (i == 0)
                    return 'won';
                else
                    return 'lost';
            })
            .attr('cx', 30)
            .attr('cy', function(_d, i) {
                return 12 + i * 15;
            })
            .attr('r', 5)
            .attr('fill', '#ffab00');

        legend.selectAll('text')
            .data(labels)
            .enter()
            .append('text')
            .attr('class', 'legend-label')
            .attr('x', 50)
            .attr('y', function(_, i) {
                return 12 + i * 15;
            })
            .text(d => d)
            .style('alignment-baseline', 'middle')

        this.setupButtons()
    }

    applyBlindSafe(darkmode, blindsafe) {
        if (blindsafe) {
            //Update line chart's lines and legend components
            line.selectAll('.won-line')
                .style('stroke', '#33a02c');

            line.selectAll('.lost-line')
                .style('stroke', '#1f78b4');

            legend.select('circle.won')
                .style('fill', '#33a02c');

            legend.select('circle.lost')
                .style('fill', '#1f78b4');
        } else {
            if (darkmode) {
                //Update line chart's lines and legend components
                line.selectAll('.won-line')
                    .style('stroke', '#1b9e77');

                line.selectAll('.lost-line')
                    .style('stroke', '#d95f02');

                legend.select('circle.won')
                    .style('fill', '#1b9e77');

                legend.select('circle.lost')
                    .style('fill', '#d95f02');
            } else {
                //Update line chart's lines and legend components
                line.selectAll('.won-line')
                    .style('stroke', '#8dd3c7');

                line.selectAll('.lost-line')
                    .style('stroke', '#fb8072');

                legend.select('circle.won')
                    .style('fill', '#8dd3c7');

                legend.select('circle.lost')
                    .style('fill', '#fb8072');
            }
        }
    }

    applyThemeChanged(darkmode, blindsafe) {
        if (darkmode) {
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
}

//todo: don't loose focus when data changes
function brushend(self, isCumulative) {
    var selection = d3.event.selection
    if (selection) {
        //Updating scales
        var minYear = xScale.invert(selection[0]),
            maxYear = xScale.invert(selection[1]);

        xScale.domain([minYear, maxYear]);
        line.select('.brush').call(self.brush.move, null);

        if (!isCumulative) {
            minYear *= 100;
            maxYear *= 100;
        }

        //reflects changes on map
        controller.setBrushedLinePeriod(minYear, maxYear);

        zooming(self)
    }
}

function zooming(self) {
    var transition = self.chart.transition().duration(1000);

    //Transitioning x axis
    xAxis.transition(transition).call(d3.axisBottom(xScale)
        .tickFormat(function(d) {
            if (d == 0) return 0;
            if (d < 0) return -d + "BC";
            return d + "AD"
        }));

    //Transitioning line
    line.selectAll('.won-line')
        .transition(transition)
        .attr('d', path);

    line.selectAll('.lost-line')
        .transition(transition)
        .attr('d', path);

    self.applyThemeChanged(controller.darkmode, controller.blindsafe)
}

function getCentury(y) {
    if (y > 0) return Math.floor(y / 100) + 1;
    return Math.floor(y / 100);
}

export default new LineChart()