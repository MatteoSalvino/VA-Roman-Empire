const d3 = require('d3');

var width = 600
var height = 400
var margin = { top: 30, bottom: 30, left: 30, right: 30 };

var container, scatterplot;

class ScatterPlot {
    constructor() {
        this.setup()
    }

    notifyDataChanged() {}


    setup() {
        container = d3.select("#scatterplot_container")
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true);

        scatterplot = container.append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width + " " + height)
            // Class to make it responsive.
            .classed("svg-content-responsive", true);

        drawBorders()
    }

}

function drawBorders() {
    scatterplot.append("rect")
        .classed("rect_b", true)
        .attr("width", width)
        .attr("height", height);
}

export default new ScatterPlot()