import mapBuilder from './map'
import lineChart from './lineChart'
import barChartBuilder from './barChart'
import boxplotBuilder from './boxPlot'

const d3 = require('d3');

class Controller {
    constructor() {
        this.battles = undefined
        this.wars = undefined
        this.map = undefined
        this.brushedMapData = undefined
    }

    resetBrushedMapData() {
        this.brushedMapData = this.battles
        this.onBrushedMapDataChanged()
    }

    setBrushedMapData(battles) {
        this.brushedMapData = battles
        this.onBrushedMapDataChanged()
    }

    onBrushedMapDataChanged() {
        lineChart.setBattles(this.brushedMapData)
        lineChart.notifyDataChanged()
    }

    setup() {
        var c = this
        this.loadData().then(function(data) {
            c.setData(data)
            c.setupGraphs()
        }).catch(function(error) {
            console.log(error);
            throw error;
        })
    }

    setData(data) {
        this.map = data[0]
        this.battles = data[1]
        this.wars = data[2]
    }

    setupButtons() {
        d3.select("#cumulativeBtn")
            .on("click", _e => {
                lineChart.clear();
                lineChart.drawCumulativeChart();
            });

        d3.select("#centuriesBtn")
            .on("click", _e => {
                lineChart.clear();
                lineChart.drawChart();
            });
    }

    setupGraphs() {
        mapBuilder.populateMap(this.map);
        mapBuilder.addMarkers(this.battles);

        lineChart.setBattles(this.battles)
        lineChart.notifyDataChanged()
        barChartBuilder.populateChart(this.battles);
        boxplotBuilder.populate(this.wars);

        this.setupButtons()
    }

    loadData() {
        return Promise.all([
            d3.json('./empire_map.json'),
            d3.csv('/battles.csv'),
            d3.csv('/wars.csv')
        ])
    }
}

export default new Controller()