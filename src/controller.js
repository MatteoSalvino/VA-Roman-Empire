import mapChart from './map'
import lineChart from './lineChart'
import stackedBarChart from './stackedBarChart'
import boxplot from './boxPlot'
import scatterPlot from './scatterPlot';

const d3 = require('d3');

class Controller {
    //todo: refactor!
    constructor() {
        this.battles = []
        this.wars = []
        this.map = undefined
        this.brushedMapData = []
        this.brushedLineData = []
        this.brushedWars = []
        this.filters = { ground: true, naval: true, civil: true }
        this.filteredBattles = []
    }

    /**
     * Method to be called from within MapChart when the brush is interrupted
     * by the user. It updates all the other views (for now line chart and
     * boxplot)
     * @see onBrushedMapDataChanged
     */
    resetBrushedMapData() {
        this.brushedMapData = this.filteredBattles
        this.onBrushedMapDataChanged()
    }

    /**
     * Method to be called from within MapChart when a brush is performed. It updates all the other views
     * @see onBrushedMapDataChanged
     * @param {Array} battles - the battles inside the brush
     *
     * @todo - the lineChart is always redrawn from scratch (is it ok?)
     */
    setBrushedMapData(battles) {
        this.brushedMapData = battles.filter(b => this.filteredBattles.includes(b))
        this.onBrushedMapDataChanged()
    }

    /**
     * Method to be called from within LineChart when a brush-zoom is performed. It updates all the other views
     *
     * @param {number} minYear - the starting year
     * @param {number} maxYear - the ending year
     */
    setBrushedLinePeriod(minYear, maxYear) {

        this.brushedLineData = this.filteredBattles.filter(b => b.year >= minYear && b.year <= maxYear)
        mapChart.resetPeriod(minYear, maxYear)
        mapChart.notifyDataChanged(false)

        this.notifyBarChart()
    }

    /**
     * Method to be called from within LineChart when a brush-zoom is interrupted. It updates all the other views
     */
    resetBrushedLineData() {
        this.brushedLineData = this.filteredBattles
        mapChart.resetPeriod()
        mapChart.notifyDataChanged(false)
        this.notifyBarChart()
    }

    onBrushedMapDataChanged() {
        lineChart.setBattles(this.brushedMapData)
        lineChart.notifyDataChanged()

        this.brushedWars = this.wars.filter(w => this.brushedMapData.map(x => x.warId).includes(w.id))

        boxplot.setWars(this.brushedWars)
        boxplot.notifyDataChanged()

        this.notifyBarChart()

    }

    notifyBarChart() {
        var foo = this.brushedMapData.filter(b => this.brushedLineData.includes(b))
        stackedBarChart.setBattles(foo)
        stackedBarChart.notifyDataChanged(foo)
    }

    setup() {
        var self = this
        this.loadData().then(function(data) {
            self.map = data[0]
            self.battles = data[1]
            self.filteredBattles = data[1]
            self.brushedLineData = self.battles
            self.wars = data[2]
            self.setupGraphs()
        }).catch(function(error) {
            console.log(error);
            throw error;
        })
    }

    setupGraphs() {
        mapChart.bind("#map_container")
        lineChart.bind("#line_chart_container")
        stackedBarChart.bind("#bar_chart_container")
        boxplot.bind("#boxplot_container")
        scatterPlot.bind("#scatterplot_container")

        mapChart.setMap(this.map)
        mapChart.setBattles(this.battles)
        mapChart.notifyDataChanged(true)

        lineChart.setBattles(this.battles)
        lineChart.notifyDataChanged()

        stackedBarChart.setBattles(this.battles)
        stackedBarChart.notifyDataChanged()

        boxplot.setWars(this.wars)
        boxplot.notifyDataChanged()

        scatterPlot.notifyDataChanged()

        this.setupButtons()
        this.setupFilters()
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

    updateFilteredBattles() {
        var self = this
        this.filteredBattles = this.battles.filter(function(b) {
            var isNaval = b.naval == 'y'
            var isGround = !isNaval
            var isCivil = b.civil == 'y'

            return (isNaval && self.filters.naval) || (isGround && self.filters.ground) || (isCivil && self.filters.civil)
        })


        mapChart.setBattles(this.filteredBattles)
        mapChart.notifyDataChanged(false)

        lineChart.setBattles(this.filteredBattles)
        lineChart.notifyDataChanged()

        this.notifyBarChart()


    }


    setupFilters() {
        var ground_counter = 0,
            naval_counter  = 0,
            civil_counter  = 0,
            battles_size = this.battles.length

        this.battles
            .forEach(function(d) {
              if(d.naval == 'y')
                naval_counter++
              else
                ground_counter++

              if(d.civil == 'y')
                civil_counter++
            });

        //Filters's labels update
        d3.select('#ground_filter_label')
          .text('Ground (' + Math.ceil((ground_counter / battles_size) * 100) + '%)');

        d3.select('#naval_filter_label')
        .text('Naval (' + Math.floor((naval_counter / battles_size) * 100) + '%)');

        d3.select('#civil_filter_label')
        .text('Civil (' + Math.floor((civil_counter / battles_size) * 100) + '%)');


        var ground_filter = d3.select('#ground_filter'),
            naval_filter = d3.select('#naval_filter'),
            civil_filter = d3.select('#civil_filter')

        ground_filter.on('click', _d => {
            this.filters.ground = ground_filter.property('checked')
            this.updateFilteredBattles()
        });

        naval_filter.on('click', _d => {
            this.filters.naval = naval_filter.property('checked')
            this.updateFilteredBattles()
        });

        civil_filter.on('click', _d => {
            this.filters.civil = civil_filter.property('checked')
            this.updateFilteredBattles()
        })

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
