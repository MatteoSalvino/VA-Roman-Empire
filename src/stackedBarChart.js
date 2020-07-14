const d3 = require('d3');
import BorderedChart from './borderedChart';
import controller from './controller';

var xScale, yScale, xAxis, yAxis, groups, tooltip, legend

class StackedBarChart extends BorderedChart {
    constructor() {
        super()
        this.margin.right = 120 //lazy fix
        this.battles = []
    }

    setBattles(battles) {
        this.battles = battles
    }

    drawChart() {
        //Process given battles
        var barData = this.makeDataset();

        //Axis scales and axis
        xScale = d3.scaleBand()
            .range([this.margin.left, this.width - this.margin.right])
            .padding(0.5)
            .domain(barData.map(function (d) { return d.attack; }));

        yScale = d3.scaleLinear()
            .range([this.height - this.margin.bottom, this.margin.top])
            .domain([0, d3.max(barData, function (d) { return d.total + 1; })]);


        xAxis = this.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + (this.height - this.margin.bottom) + ')')
            .call(d3.axisBottom(xScale));

        yAxis = this.chart.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + this.margin.bottom + ', 0)')
            .call(d3.axisLeft(yScale).ticks(d3.max(barData, function (d) { return d.total + 1; })));

        //Split our dataset in layers
        var stack = d3.stack()
            .keys(['won', 'lost', 'civil']);

        var dataset = stack(barData);

        groups = this.chart.selectAll('g.layer')
            .data(dataset)
            .enter()
            .append('g')
            .attr('class', 'layer')
            .attr('fill', function (_d, i) {
                if (i == 0)
                    return '#33a02c';
                else if (i == 1)
                    return '#1f78b4';
                else
                    return '#a6cee3';
            });

        groups.selectAll("rect")
            .data(function (d) { return d; })
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr('x', function (d) { return xScale(d.data.attack); })
            .attr('y', function (d) { return yScale(d[1]); })
            .attr("width", xScale.bandwidth())
            .attr("height", function (d) { return yScale(d[0]) - yScale(d[1]); })
            .on('mouseover', function (d) {
                tooltip.select('text').text(d[1] - d[0]);
                tooltip.style('display', null);
            })
            .on('mousemove', function () {
                const xPosition = d3.mouse(this)[0] - 20;
                const yPosition = d3.mouse(this)[1] - 25;
                tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
            })
            .on('mouseout', function () {
                tooltip.style('display', 'none');
            });

        //tooltip to show categories details (We should modularize it ?)
        tooltip = this.chart.append('g')
            .style('display', 'none');

        tooltip.append('rect')
            .attr('width', 30)
            .attr('height', 20)
            .attr('fill', 'white')
            .style('opacity', 0.5);

        tooltip.append('text')
            .attr('x', 15)
            .attr('y', 13)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .style('text-anchor', 'middle');

        this._setupLegend();
        this.applyThemeChanged(controller.darkmode, controller.blindsafe);
    }

    notifyDataChanged() {
        this.clear()
        this.drawChart()
    }

    makeDataset() {
        var dataset = resetDataset()
        this.battles.forEach(function (d) {

            var outcome = d.outcome != "" ? d.outcome : "-";

            if (d.siege == 'y') dataset['sieges'][outcome] += 1
            if (d.sack == 'y') dataset['sacks'][outcome] += 1
            if (d.final == 'y') dataset['final'][outcome] += 1
        });

        //console.log(dataset);

        var barData = [];
        const keys = Object.keys(dataset);

        for (var i = 0; i < keys.length; i++) {
            var curr = dataset[keys[i]];
            var total = Object.values(curr).reduce((a, b) => a + b, 0);

            barData.push({ 'attack': keys[i], 'won': curr['W'], 'lost': curr['L'], 'uncertain': curr['-'], 'civil' : curr['C'], 'total': total });
        }
        return barData;
    }

    _setupLegend() {
        var civil_flag = controller.filters.civil;
        var labels = ['won', 'lost', 'civil'].filter(function (d, i) {
          return !(i == 2 && !civil_flag)
        })

        legend = this.chart.append("svg")
            .attr("width", 150)
            .attr("height", 85)
            .attr('x', 410)
            .attr('y', 30);


        legend.selectAll('circle')
            .data(labels)
            .enter()
            .append('circle')
            .attr('class', function (d, i) {
                if (i == 0)
                    return 'won';
                else if (i == 1)
                    return 'lost';
                else
                    return 'civil';
            })
            .attr('cx', 30)
            .attr('cy', function (_d, i) {
                return 20 + i * 15;
            })
            .attr('r', 5);

        legend.selectAll('text')
            .data(labels)
            .enter()
            .append('text')
            .attr('class', 'legend-label')
            .attr('x', 50)
            .attr('y', function (_d, i) {
                return 20 + i * 15;
            })
            .text(function(d) {
              return d;
            })
            .style('alignment-baseline', 'middle');
    }

    applyBlindSafe(darkmode, blindsafe) {
        if (blindsafe) {
            //Update stacked chart layers
            this.chart.selectAll('g.layer')
                .style('fill', function (_d, i) {
                    if (i == 0)
                        return '#33a02c';
                    else if (i == 1)
                        return '#1f78b4';
                    else
                        return '#b2df8a';
                });

            //Update legend components
            legend.select('circle.won')
                .style('fill', '#33a02c');

            legend.select('circle.lost')
                .style('fill', '#1f78b4');

            legend.select('circle.civil')
                .style('fill', '#b2df8a');
        } else {
            if (darkmode) {
                //Update stacked chart layers
                this.chart.selectAll('g.layer')
                    .style('fill', function (_d, i) {
                        if (i == 0)
                            return '#1b9e77';
                        else if (i == 1)
                            return '#d95f02';
                        else
                            return '#7570b3';
                    });

                //Update legend components
                legend.select('circle.won')
                    .style('fill', '#1b9e77');

                legend.select('circle.lost')
                    .style('fill', '#d95f02');

                legend.select('circle.civil')
                    .style('fill', '#7570b3');
            } else {
                //Update stacked chart layers
                this.chart.selectAll('g.layer')
                    .style('fill', function (_d, i) {
                        if (i == 0)
                            return '#8dd3c7';
                        else if (i == 1)
                            return '#fb8072';
                        else
                            return '#ffffb3';
                    });

                //Update legend components
                legend.select('circle.won')
                    .style('fill', '#8dd3c7');

                legend.select('circle.lost')
                    .style('fill', '#fb8072');

                legend.select('circle.civil')
                    .style('fill', '#ffffb3');
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

function resetDataset() {
    var dataset = {};
    const keys = ['sacks', 'sieges', 'final'];
    const status = ['W', 'L', 'C', '-'];

    for (var i = 0; i < keys.length; i++) {
        dataset[keys[i]] = [];

        for (var j = 0; j < status.length; j++)
            dataset[keys[i]][status[j]] = 0;
    }

    return dataset;
}

export default new StackedBarChart()
