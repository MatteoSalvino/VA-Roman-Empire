import mapChart from './map'
import lineChart from './lineChart'
import barChartBuilder from './barChart'
import boxplot from './boxPlot'

const d3 = require('d3');

class Controller {
    constructor() {
        this.battles = undefined
        this.wars = undefined
        this.map = undefined
        this.brushedMapData = undefined
        this.brushedLineData = undefined
        this.brushedWars = undefined
    }

    resetBrushedMapData() {
        this.brushedMapData = this.battles
        this.onBrushedMapDataChanged()
    }

    setBrushedMapData(battles) {
        this.brushedMapData = battles
        this.onBrushedMapDataChanged()
    }

    setBrushedLinePeriod(minYear, maxYear) {
        mapChart.resetPeriod(minYear, maxYear)
        mapChart.notifyDataChanged(false)
    }

    onBrushedMapDataChanged() {
        lineChart.setBattles(this.brushedMapData)
        lineChart.notifyDataChanged()

        this.brushedWars = this.wars.filter(w => this.brushedMapData.map(x => x.warId).includes(w.id))

        boxplot.setWars(this.brushedWars)
        boxplot.notifyDataChanged()
    }

    resetBrushedLineData() {
        this.brushedLineData = this.battles
        mapChart.resetPeriod()
        mapChart.notifyDataChanged(false)
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
        mapChart.setMap(this.map);
        mapChart.setBattles(this.battles);
        mapChart.notifyDataChanged(true)

        lineChart.setBattles(this.battles)
        lineChart.notifyDataChanged()

        barChartBuilder.populateChart(this.battles);
        boxplot.setWars(this.wars);
        boxplot.notifyDataChanged();

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