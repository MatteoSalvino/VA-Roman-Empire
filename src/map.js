import controller from './controller'
import BorderedChart from './borderedChart'

const d3 = require('d3')

var isBrushing = false,
    brushedArea = undefined

var legend, projection, path, markerGroup

class Map extends BorderedChart {
    constructor() {
        super()
        this.map = []
        this.battles = []
        this.wars = []
        this.resetPeriod()
    }

    onBindBrush() {
        super.onBindBrush()
        this.brush.extent([
            [0, 0],
            [this.width, this.height]
        ])
    }

    setMap(map) { this.map = map }

    setBattles(battles) { this.battles = battles }

    setWars(wars) { this.wars = wars }

    resetPeriod(min = -Infinity, max = Infinity) {
        this.period = { min: min, max: max }
    }

    onBindView(selector) {
        super.onBindView(selector)

        // create a Geo Projection
        projection = d3.geoMercator()
            .translate([120, 600])
            .scale(500)
            .precision(10)

        path = d3.geoPath()
            .projection(projection)
    }

    notifyDataChanged(redraw = true) {
        redraw ? this.drawChart() : this.update()
    }

    /**
     * It adds/removes the class **scattered** to the circles on the map,
     * depending on their id. There is no cache management at this level.
     *
     * @param {Array<number>} ids identifiers of the battles
     */
    setScatterBattles(ids = []) {
        markerGroup.selectAll("circle")
            .each(function(d) {
                d3.select(this)
                    .classed('scattered', ids.includes(+d.id))
            })
    }

    drawChart() {
        this.chart.selectAll('path')
            .data(this.map.features)
            .enter()
            .append('path')
            .attr('class', 'state')
            .attr('id', function(d) {
                return d.properties['OBJECTID']
            })
            .attr('d', path)

        markerGroup = this.chart.append('g')
            .attr('class', 'brush')
            .call(this.brush)

        var self = this
        markerGroup.append('g')
            .selectAll('circle')
            .data(this.battles)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('class', function(d) {
                switch (d.outcome) {
                    case 'W':
                        return 'won'
                    case 'L':
                        return 'lost'
                    case 'C':
                        return 'civil'
                    default:
                        return 'uncertain'
                }
            })
            .attr('r', 4)
            .attr('fill', 'blue')
            .attr('pointer-events', 'visible')
            .on('click', function(d) {
                d3.selectAll('.selected')
                    .classed('selected', false)

                d3.select(this)
                    .classed('selected', true)
                setLabel(self, d)
            })
            .attr('data-toggle', 'modal')
            .attr('data-target', '#modal_container')
            .style('visibility', 'visible')

        legend = this.setupLegend()
        this.applyThemeChanged(controller.darkmode, controller.blindsafe)
    }

    update() {
        var points = 0
        var self = this
        var minYear = Infinity,
            maxYear = -Infinity
        var selector = isBrushing ? ".brushed" : "circle"
        markerGroup.selectAll(selector)
            .each(function(d) {
                var ok = self.battles.filter(b => b.id == d.id).length > 0
                if (ok && +d.year >= self.period.min && +d.year <= self.period.max) {
                    points++
                    minYear = d3.min([minYear, +d.year])
                    maxYear = d3.max([maxYear, +d.year])
                    d3.select(this)
                        .style('visibility', 'visible')
                        .attr('stroke-width', 0.5)
                        .attr('stroke', 'white')
                    setLabel(self, d)
                } else d3.select(this).style('visibility', 'hidden')
            })

        updateLegend(points, minYear, maxYear)
    }

    onBrush() {
        //reset previous scatter brush
        this.setScatterBattles()
        var self = this
        var selection = d3.event.selection

        var isClick = JSON.stringify(brushedArea) == JSON.stringify(selection)
        brushedArea = selection

        var points = 0
        var minYear = Infinity
        var maxYear = -Infinity

        var echo = []
        if (selection) {
            if (!isClick) {
                isBrushing = true
                markerGroup.selectAll('circle')
                    .style('visibility', function(d) {
                        var cx = d3.select(this).attr('cx')
                        var cy = d3.select(this).attr('cy')
                            //Check if the point is inside the brushed area
                        var isBrushed = (cx >= selection[0][0] && cx <= selection[1][0] &&
                            cy >= selection[0][1] && cy <= selection[1][1])

                        if (isBrushed) {
                            echo.push(d)
                            points++
                            minYear = d3.min([minYear, +d.year])
                            maxYear = d3.max([maxYear, +d.year])
                            d3.select(this)
                                .classed('brushed', true)
                                .attr('stroke-width', 0.5)
                                .attr('stroke', 'white')

                            setLabel(self, d)
                            return 'visible'
                        }
                        d3.select(this).attr('stroke-width', 0).classed('brushed', false)
                        return 'hidden'
                    })
                updateLegend(points, minYear, maxYear)
                controller.setBrushedMapData(echo)
            }
        } else {
            isBrushing = false
            markerGroup.selectAll('circle')
                .style('visibility', "visible")
            resetLegend()
            controller.resetBrushedMapData()
        }
    }

    setupLegend() {
        var legend = this.chart.append("svg")
            .attr("width", 200)
            .attr("height", 120)
            .attr('x', 400)
            .attr('y', 10)

        legend.append('text')
            .attr('id', 'battle_label')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 20)
            .attr('font-size', 12)
            .attr('font-weight', 'bold')

        legend.append('text')
            .attr('id', 'battle_year')
            .attr('class', 'legend-label')
            .attr('x', 5)
            .attr('y', 40)
            .attr('font-size', 10)

        return legend
    }

    applyThemeChanged(darkmode, blindsafe) {
        if (darkmode && !blindsafe) {
            //Update battles on map
            markerGroup.selectAll('circle.won')
                .style('fill', '#1b9e77')

            markerGroup.selectAll('circle.lost')
                .style('fill', '#d95f02')

            markerGroup.selectAll('circle.civil')
                .style('fill', '#7570b3')

            markerGroup.selectAll('circle.uncertain')
                .style('fill', '#e7298a')

            //Update map's paths, svg and legend
            this.chart.selectAll('path.state')
                .style('fill', '#255874')
                .style('stroke', '#737373')

            legend.selectAll('text.legend-label')
                .style('fill', '#cccccc')

        } else if ((!darkmode && blindsafe) || (darkmode && blindsafe)) {
            //Update battles on map
            markerGroup.selectAll('circle.won')
                .style('fill', '#33a02c')

            markerGroup.selectAll('circle.lost')
                .style('fill', '#1f78b4')

            markerGroup.selectAll('circle.civil')
                .style('fill', '#b2df8a')

            markerGroup.selectAll('circle.uncertain')
                .style('fill', '#a6cee3')

            if (!darkmode) {
                //Update map's paths, svg and legend
                this.chart.selectAll('path.state')
                    .style('fill', '#b1d4e7')
                    .style('stroke', '#b3b3b3')

                legend.selectAll('text.legend-label')
                    .style('fill', '#808080')
            } else {
                //Update map's paths, svg and legend
                this.chart.selectAll('path.state')
                    .style('fill', '#255874')
                    .style('stroke', '#737373')

                legend.selectAll('text.legend-label')
                    .style('fill', '#cccccc')
            }
        } else {
            //!darkmode && !blindsafe

            //Update battles on map
            markerGroup.selectAll('circle.won')
                .style('fill', '#8dd3c7')

            markerGroup.selectAll('circle.lost')
                .style('fill', '#fb8072')

            markerGroup.selectAll('circle.civil')
                .style('fill', '#ffffb3')

            markerGroup.selectAll('circle.uncertain')
                .style('fill', '#bebada')

            //Update map's paths, svg and legend
            this.chart.selectAll('path.state')
                .style('fill', '#b1d4e7')
                .style('stroke', '#b3b3b3')

            legend.selectAll('text.legend-label')
                .style('fill', '#808080')
        }
    }
}

function updateLegend(numBattles, min, max) {
    resetLegend()
    switch (numBattles) {
        case 0:
            break
        case 1:
            legend.select('#battle_label')
                .text(numBattles + " battle selected")
            break
        default:
            legend.select('#battle_label')
                .text(numBattles + " battles selected")
            legend.select('#battle_year')
                .text('From ' + parseRoman(Math.trunc(min)) + ' to ' + parseRoman(Math.trunc(max)))
            break
    }
}

function parseRoman(y) {
    if (y == 0) return 0
    if (y < 0) return -y + "BC"
    return y + "AD"
}

function setLabel(self, d) {
    var war = self.wars.filter(x => d.warId === x.id)
    var commanders = controller.commanders.filter(x => d.id === x.id)
    var allies = controller.allies.filter(x => d.id === x.id)
    var image = controller.images.filter(x => d.id === x.id)[0].img
    var modal_container = d3.select('#modal_container')

    modal_container.select('#modalImg').attr('src', image == "" ? './assets/placeholder.png' : image)


    modal_container.select('.modal-title')
        .text(d.label)

    modal_container.select('#battle_date')
        .text(parseRoman(d.year))

    modal_container.select('#battle_location')
        .text(d.locationLabel)
        .attr('href', 'https://pleiades.stoa.org/places/' + d.stoaId)
        .classed('inactive-link', () => d.stoaId == '-')

    modal_container.select('#battle_war')
        .text("-")

    modal_container.select('#battle_outcome')
        .text(d.outcome)

    modal_container.select('#romanCommanders')
        .text(function() {
            if (commanders[0].RomanCommanders == "")
                return "-"
            return commanders[0].RomanCommanders
        })

    modal_container.select('#enemyCommanders')
        .text(function() {
            if (commanders[0].EnemyCommanders == "")
                return "-"
            return commanders[0].EnemyCommanders
        })

    modal_container.select('#romanAllies')
        .text(function() {
            if (allies[0].RomanAllies == "")
                return "-"
            return allies[0].RomanAllies
        })

    modal_container.select('#enemyAllies')
        .text(function() {
            if (allies[0].EnemyAllies == "")
                return "-"
            return allies[0].EnemyAllies
        })

    modal_container.select('#romanStrength')
        .text(function() {
            if (allies[0].RomanStrength == "")
                return "-"
            return allies[0].RomanStrength
        })

    modal_container.select('#romanLosses')
        .text(function() {
            if (allies[0].RomanLosses == "")
                return "-"
            return allies[0].RomanLosses

        })

    modal_container.select('#enemyStrength')
        .text(function() {
            if (allies[0].EnemyStrength == "")
                return "-"
            return allies[0].EnemyStrength
        })

    modal_container.select('#enemyLosses')
        .text(function() {
            if (allies[0].EnemyLosses == "")
                return "-"
            return allies[0].EnemyLosses
        })

    var modalOnClick = function() {}
    if (war != null && war.length > 0 && war[0].wikidata != '') {
        modal_container.select('#battle_war')
            .text(war[0].label)

        modalOnClick = function() {
            window.open("https://www.wikidata.org/wiki/" + war[0].wikidata)
        }
    }

    modal_container.select('#explore-btn')
        .on('click', modalOnClick)
}

function resetLegend() {
    legend.select('#battle_label')
        .text('')
    legend.select('#battle_year')
        .text('')
}

export default new Map()
