import mapChart from './map'
import lineChart from './lineChart'
import stackedChart from './barChart'
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

    /**
     * Method to be called from within MapChart when the brush is interrupted
     * by the user. It updates all the other views (for now line chart and
     * boxplot)
     * @see onBrushedMapDataChanged
     */
    resetBrushedMapData() {
        this.brushedMapData = this.battles
        this.onBrushedMapDataChanged()
    }

    /**
     * Method to be called from within MapChart when a brush is performed. It updates all the other views (for now line chart and boxplot)
     * @see onBrushedMapDataChanged
     * @param {Array} battles - the battles inside the brush
     *
     * @todo - the lineChart is always redrawn from scratch (is it ok?)
     */
    setBrushedMapData(battles) {
        this.brushedMapData = battles
        this.onBrushedMapDataChanged()
    }

    /**
     * Method to be called from within LineChart when a brush-zoom is performed. It updates all the other views (for now the map chart)
     *
     * @param {number} minYear - the starting year
     * @param {number} maxYear - the ending year
     */
    setBrushedLinePeriod(minYear, maxYear) {
        mapChart.resetPeriod(minYear, maxYear)
        mapChart.notifyDataChanged(false)
    }

    /**
     * Method to be called from within LineChart when a brush-zoom is interrupted. It updates all the other views (for now the map chart)
     */
    resetBrushedLineData() {
        this.brushedLineData = this.battles
        mapChart.resetPeriod()
        mapChart.notifyDataChanged(false)
    }

    onBrushedMapDataChanged() {
        lineChart.setBattles(this.brushedMapData)
        lineChart.notifyDataChanged()

        this.brushedWars = this.wars.filter(w => this.brushedMapData.map(x => x.warId).includes(w.id))

        boxplot.setWars(this.brushedWars)
        boxplot.notifyDataChanged()
    }

    setup() {
        var self = this
        this.loadData().then(function(data) {
            self.map = data[0]
            self.battles = data[1]
            self.wars = data[2]
            self.setupGraphs()
        }).catch(function(error) {
            console.log(error);
            throw error;
        })
    }

    setupGraphs() {
        mapChart.setMap(this.map)
        mapChart.setBattles(this.battles)
        mapChart.notifyDataChanged(true)

        lineChart.setBattles(this.battles)
        lineChart.notifyDataChanged()

        stackedChart.setBattles(this.battles)
        stackedChart.notifyDataChanged()

        boxplot.setWars(this.wars)
        boxplot.notifyDataChanged()

        this.setupButtons()
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

    loadData() {
        return Promise.all([
            d3.json('./map.json'),
            d3.csv('/battles.csv'),
            d3.csv('/wars.csv')
        ])
    }
}

export default new Controller()
