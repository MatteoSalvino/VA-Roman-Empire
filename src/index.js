import 'normalize.css'
import './index.scss'
import mapBuilder from './map'
import lineChartBuilder from './lineChart'
import barChartBuilder from './barchart'

const d3 = require('d3');

Promise.all([
    d3.json('./empire_map.json'),
    d3.csv('/battles.csv')
]).then(function(data) {
    var map = data[0],
        battles = data[1];


    mapBuilder.populateMap(map);
    mapBuilder.addMarkers(battles);

    lineChartBuilder.populateChart(battles);

    barChartBuilder.populateChart(battles);

}).catch(function(error) {
    throw error;
});