const d3 = require('d3');

class BorderedChart {
    constructor(size = { width: 600, height: 400 }, margin = { top: 30, bottom: 30, left: 30, right: 30 }) {
        this.width = size.width
        this.height = size.height
        this.margin = margin
    }

    bind(selector) {
        this.onBindView(selector)
        this.drawBorders()
        this.onBindBrush()
        this.onBindClip()
    }

    onBindView(selector) {
        this.container = d3.select(selector)
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true);

        console.log(this.width)
        this.chart = this.container.append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + this.width + " " + this.height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true)
    }

    drawBorders() {
        this.chart.append("rect")
            .classed("rect_b", true)
            .attr("width", this.width)
            .attr("height", this.height);
    }

    onBindBrush() {
        this.brush = d3.brush()
            .extent([
                [this.margin.left, this.margin.top],
                [this.width - this.margin.right, this.height - this.margin.bottom]
            ])
            .on('start brush end', () => this.onBrush())
    }

    clear() {
        //todo: avoid removing and drawing borders again!
        this.chart.selectAll("*").remove();
        this.drawBorders();
    }

    onBindClip() {
        this.clip = this.chart.append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('width', this.width - this.margin.left - this.margin.right)
            .attr('height', this.height - this.margin.top - this.margin.bottom)
            .attr('x', this.margin.left)
            .attr('y', this.margin.top);
    }
}

export default BorderedChart