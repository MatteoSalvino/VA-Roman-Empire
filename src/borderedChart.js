const d3 = require('d3')

class BorderedChart {
    constructor(size = { width: 600, height: 400 }, margin = { top: 30, bottom: 30, left: 30, right: 30 }) {
        this.width = size.width
        this.height = size.height
        this.margin = margin
    }

    /**
     * Binds the HTML selector to the object.
     */
    bind(selector) {
        this.onBindView(selector)
        this.onBindBrush()
        this.onBindClip()
    }

    /**
     * Binds the HTML selector to the container.
     */
    onBindView(selector) {
        this.container = d3.select(selector)
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true);

        this.chart = this.container.append("svg")
            // Responsive SVG needs these 2 attributes
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + this.width + " " + this.height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true)
    }

    onBindBrush() {
        this.brush = d3.brush()
            .extent([
                [this.margin.left, this.margin.top],
                [this.width - this.margin.right, this.height - this.margin.bottom]
            ])
            .on('start brush end', () => this.onBrush())
    }

    onBindClip() {
        this.clip = this.chart.append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('width', this.width - this.margin.left - this.margin.right)
            .attr('height', this.height - this.margin.top - this.margin.bottom)
            .attr('x', this.margin.left)
            .attr('y', this.margin.top)
    }

    /**
     * Removes all the children of the current responsive container.
     */
    clear() {
        this.chart.selectAll("*").remove()
    }
}

export default BorderedChart
