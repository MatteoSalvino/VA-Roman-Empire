import mapChart from './map'
import lineChart from './lineChart'
import stackedBarChart from './stackedBarChart'
import boxplot from './boxPlot'
import scatterPlot from './scatterPlot'

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
        this.filters = { ground: true, naval: true, civil: true, not_civil: true }
        this.filteredBattles = []
        this.blindsafe = false
        this.darkmode = false
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

    /**
     * Method to be called from within app/index. It loads the dataset and
     * draws all the charts. Moreover it initializes the filters and adds the
     * corresponding listeners.
     *
     * @throws an error, and logs to console, if data cannot be read.
     */
    setup() {
        var self = this
        this.loadData().then(function(data) {
            self.map = data[0]
            self.battles = data[1]
            self.filteredBattles = data[1]
            self.brushedLineData = self.battles
            self.wars = data[2]
            self.setupFilters()
            self.setupGraphs()
        }).catch(function(error) {
            console.log(error);
            throw error;
        })
    }

    /**
     * Draws all the charts and makes the proper bindings.
     */
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
    }

    /**
     * Updates the charts when filters change (they are handled as checkboxes).s
     */
    updateFilteredBattles() {
        var self = this
        this.filteredBattles = this.battles.filter(function(b) {
            var isNaval = b.naval == 'y'
            var isGround = !isNaval
            var isCivil = b.civil == 'y'
            var isNotCivil = !isCivil

            var f1 = (isNaval && self.filters.naval) || (isGround && self.filters.ground)
            var f2 = (isCivil && self.filters.civil) || (isNotCivil && self.filters.not_civil)
            return f1 && f2
        })


        mapChart.setBattles(this.filteredBattles)
        mapChart.notifyDataChanged(false)

        lineChart.setBattles(this.filteredBattles)
        lineChart.notifyDataChanged()

        this.notifyBarChart()
    }

    setupFilters() {
        var naval_counter = 0,
            civil_counter = 0,
            battles_size = this.battles.length

        this.battles
            .forEach(function(d) {
                if (d.naval == 'y')
                    naval_counter++

                    if (d.civil == 'y')
                        civil_counter++
            })

        //Filters's labels update
        var naval_p = Math.ceil((naval_counter / battles_size) * 100)
        var civil_p = Math.ceil((civil_counter / battles_size) * 100)

        d3.select('#ground_filter_label')
            .text('Ground (' + (100 - naval_p) + '%)');

        d3.select('#naval_filter_label')
            .text('Naval (' + naval_p + '%)');

        d3.select('#civil_filter_label')
            .text('Civil (' + civil_p + '%)');

        d3.select('#not_civil_filter_label')
            .text('Not Civil (' + (100 - civil_p) + '%)');

        var ground_filter = d3.select('#ground_filter'),
            naval_filter = d3.select('#naval_filter'),
            civil_filter = d3.select('#civil_filter'),
            not_civil_filter = d3.select("#not_civil_filter")

        ground_filter.on('click', _ => {
            this.filters.ground = ground_filter.property('checked')
            this.updateFilteredBattles()
        });

        naval_filter.on('click', _ => {
            this.filters.naval = naval_filter.property('checked')
            this.updateFilteredBattles()
        });

        civil_filter.on('click', _ => {
            this.filters.civil = civil_filter.property('checked')
            this.updateFilteredBattles()
        })

        not_civil_filter.on('click', _ => {
            this.filters.not_civil = not_civil_filter.property('checked')
            this.updateFilteredBattles()
        })

        var blindsafeBtn = d3.select('#blindsafeBtn'),
            darkModeBtn = d3.select('#darkModeBtn'),
            self = this;

        blindsafeBtn.on('click', function() {
            var bg = self.darkmode ? "light" : "dark"
            var blind = self.blindsafe ? "off" : "on"
            d3.select(this).attr('src', './assets/' + bg + '-eye-' + blind + '.png ')

            self.blindsafe = !self.blindsafe
            self.applyDarkMode()
        });

        darkModeBtn.on('click', function() {
            var theme = self.darkmode ? "dark" : "light"
            var blind = self.blindsafe ? "on" : "off"

            blindsafeBtn.attr('src', './assets/' + theme + '-eye-' + blind + '.png ')

            d3.select(this).attr('src', './assets/' + theme + '-theme.png')

            //update self
            self.darkmode = !self.darkmode

            //perform actions based on the value of darkmode flag
            self.applyDarkMode()
        })
    }

    loadData() {
        return Promise.all([
            d3.json('./assets/map.json'),
            d3.csv('/assets/battles.csv'),
            d3.csv('/assets/wars.csv')
        ])
    }

    applyDarkMode() {
      mapChart.applyThemeChanged(this.darkmode, this.blindsafe);
      lineChart.applyThemeChanged(this.darkmode, this.blindsafe);
      stackedBarChart.applyThemeChanged(this.darkmode, this.blindsafe);
      boxplot.applyThemeChanged(this.darkmode, this.blindsafe);
      scatterPlot.applyThemeChanged(this.darkmode, this.blindsafe);

      //General changes
      if(this.darkmode) {
        d3.selectAll('.svg-content-responsive')
            .style('background-color', '#4d4d4d')

        d3.selectAll('.container-fluid')
            .style('background-color', '#4d4d4d')

        d3.selectAll('div.row')
            .style('background-color', '#4d4d4d');

        //Update navbar with its items
        d3.select('.navbar')
          .classed('bg-light', false)
            .style('background-color', '#808080');

        d3.select('.navbar-brand')
            .style('color', '#ffffff');

        d3.select('.navbar-toggler')
            .style('border-color', '#ffffff');

        d3.selectAll('.custom-control-label')
            .style('color', '#ffffff');
      } else {
        d3.selectAll('.svg-content-responsive')
            .style('background-color', '#ffffff')

        d3.selectAll('.container-fluid')
            .style('background-color', '#ffffff')

        d3.selectAll('div.row')
            .style('background-color', '#ffffff');

        //Update navbar with its items
        d3.select('.navbar')
          .classed('bg-light', true);

        d3.select('.navbar-brand')
            .style('color', '#000000');

        d3.select('.navbar-toggler')
            .style('border-color', 'rgba(0, 0, 0, 0.1)');

        d3.selectAll('.custom-control-label')
            .style('color', '#000000');
      }
    }
}

export default new Controller()
