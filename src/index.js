import 'normalize.css'
import './index.scss'
import mapBuilder from './map'
import lineChartBuilder from './lineChart'

const d3 = require('d3');


Promise.all([
  d3.json('./empire_map.json'),
  d3.csv('./places.csv'),
  d3.csv('/battles.csv')
]).then(function(data) {
    var map = data[0],
        places = data[1],
        battles = data[2].reverse();


    mapBuilder.populateMap(map);
    mapBuilder.addMarkers(places);

    lineChartBuilder.populateChart(battles);

}).catch(function(error) {
  throw error;
});
