import 'normalize.css'
import './index.scss'
import mapBuilder from './map'
import lineChartBuilder from './lineChart'
import barChartBuilder from './barChart'
import boxplotBuilder from './boxPlot'

const d3 = require('d3');

Promise.all([
    d3.json('./empire_map.json'),
    d3.csv('/battles.csv'),
    d3.csv('/wars.csv')
]).then(function(data) {
    var map = data[0],
        battles = data[1],
        wars = data[2];

    mapBuilder.populateMap(map);
    mapBuilder.addMarkers(battles);

    lineChartBuilder.populateChart(battles);
    barChartBuilder.populateChart(battles);
    boxplotBuilder.populate(wars);

}).catch(function(error) {
    console.log(error);
    throw error;
});
