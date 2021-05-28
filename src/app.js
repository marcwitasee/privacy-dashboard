// if the data you are going to import is small, then you can import it using es6 import
// (I like to use use screaming snake case for imported json)
// import MY_DATA from './app/data/example.json'

import {myExampleUtil} from './utils';
import {select, selectAll} from 'd3-selection';
import {geoPath, geoAlbersUsa} from 'd3-geo';
import {csv, json} from 'd3-fetch';

// this command imports the css file, if you remove it your css wont be applied!
import './main.css';

// this is just one example of how to import data. there are lots of ways to do it!
json('./data/gz_2010_us_040_00_5m.json')
  .then(myVis)
  .catch(e => {
    console.log(e);
  });

function myVis(data) {
  // Static map elements
  console.log(data.features);
  const mapWidth = 650;
  const mapHeight = 500;
  const mapMargin = {top: 0, bottom: 0, left: 0, right: 0};

  const mapContainer = select('#map')
    .append('div')
    .attr('class', 'map-container')
    .style('position', 'relative');

  const mapSvg = mapContainer
    .append('svg')
    .attr('height', mapHeight)
    .attr('width', mapWidth)
    .append('g')
    .attr('id', 'map-paths')
    .attr('transform', `translate(${mapMargin.left}, ${mapMargin.top})`);

  const projection = geoAlbersUsa()
    .scale(800)
    .translate([mapWidth / 2, mapHeight / 2]);

  const myGeoPath = geoPath(projection);

  console.log(myGeoPath);

  select('#map-paths')
    .selectAll('path')
    .data(data.features)
    .join('path')
    .attr('fill', '#4C5454')
    .attr('stroke', '#F8F4F9')
    .attr('d', myGeoPath);
}
