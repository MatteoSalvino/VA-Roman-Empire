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
            var blind = self.blindsafe ? "on" : "off"
            d3.select(this).attr('src', './assets/' + bg + '-eye-' + blind + '.png ')

            self.blindsafe = !self.blindsafe
                //perform actions based on the value of blindsafe flag
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
        if (this.darkmode) {
            //Update battles on map
            d3.selectAll('circle.won')
                .style('fill', '#1b9e77');

            d3.selectAll('circle.lost')
                .style('fill', '#d95f02');

            d3.selectAll('circle.civil')
                .style('fill', '#7570b3');

            d3.selectAll('circle.uncertain')
                .style('fill', '#e7298a');

            //Update map's paths, svg and legend
            d3.selectAll('path.state')
                .style('fill', '#255874')
                .style('stroke', '#737373');

            d3.selectAll('.svg-content-responsive')
                .style('background-color', '#4d4d4d')

            d3.selectAll('.container-fluid')
                .style('background-color', '#4d4d4d')

            d3.selectAll('.legend-label')
                .style('fill', '#cccccc');

            //Update line chart's lines
            d3.selectAll('.won-line')
                .style('stroke', '#1b9e77');

            d3.selectAll('.lost-line')
                .style('stroke', '#d95f02');

            //Update axis
            d3.selectAll('path.domain')
                .style('stroke', '#ffffff');

            d3.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#ffffff');

            d3.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#ffffff');

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

            //Update stacked chart layers
            d3.selectAll('g.layer')
                .style('fill', function(_d, i) {
                    if (i == 0)
                        return '#1b9e77';
                    else if (i == 1)
                        return '#d95f02';
                    else
                        return '#e7298a';
                });

            //Update boxplot's lines and area
            d3.selectAll('.box-stroke')
                .style('stroke', '#ffffff');

            d3.selectAll('.box-area')
                .style('fill', '#255874')
                .style('stroke', '#ffffff');

            d3.selectAll('div.row')
                .style('background-color', '#4d4d4d');

        } else {
            //Update battles on map
            d3.selectAll('circle.won')
                .style('fill', '#33a02c');

            d3.selectAll('circle.lost')
                .style('fill', '#1f78b4');

            d3.selectAll('circle.civil')
                .style('fill', '#b2df8a');

            d3.selectAll('circle.uncertain')
                .style('fill', '#a6cee3');

            //Update map's paths, svg and legend
            d3.selectAll('path.state')
                .style('fill', '#b1d4e7')
                .style('stroke', '#b3b3b3');

            d3.selectAll('.svg-content-responsive')
                .style('background-color', '#ffffff')

            d3.selectAll('.legend-label')
                .style('fill', '#808080');

            //Update line chart's lines
            d3.selectAll('.won-line')
                .style('stroke', '#33a02c');

            d3.selectAll('.lost-line')
                .style('stroke', '#1f78b4');

            //Update axis colors
            d3.selectAll('path.domain')
                .style('stroke', '#000000');

            d3.selectAll('g.tick')
                .selectAll('line')
                .style('stroke', '#000000');

            d3.selectAll('g.tick')
                .selectAll('text')
                .style('fill', '#000000');

            //Update navbar with its items
            d3.select('.navbar')
                .classed('bg-light', true);

            d3.select('.navbar-brand')
                .style('color', '#000000');

            d3.select('.navbar-toggler')
                .style('border-color', 'rgba(0, 0, 0, 0.1)');

            d3.selectAll('.custom-control-label')
                .style('color', '#000000');

            //Update stacked chart layers
            d3.selectAll('g.layer')
                .style('fill', function(_d, i) {
                    if (i == 0)
                        return '#33a02c';
                    else if (i == 1)
                        return '#1f78b4';
                    else
                        return '#a6cee3';
                });

            //Update boxplot's lines and area
            d3.selectAll('.box-stroke')
                .style('stroke', '#000000');

            d3.selectAll('.box-area')
                .style('fill', '#69b3a2')
                .style('stroke', '#000000');

            d3.selectAll('div.row')
                .style('background-color', '#ffffff');
        }
    }
}

export default new Controller()