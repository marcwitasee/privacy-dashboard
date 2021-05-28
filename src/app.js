// if the data you are going to import is small, then you can import it using es6 import
// (I like to use use screaming snake case for imported json)
// import MY_DATA from './app/data/example.json'

import {myExampleUtil} from './utils';
import {select, selectAll} from 'd3-selection';
import {geoPath, geoAlbersUsa, geoAzimuthalEquidistant} from 'd3-geo';
import {csv, json} from 'd3-fetch';
import {scaleQuantize} from 'd3-scale';

// this command imports the css file, if you remove it your css wont be applied!
import './main.css';

// this is just one example of how to import data. there are lots of ways to do it!
Promise.all([
  json('./notebooks/data/clearview_ai_data.json'),
  json('./data/gz_2010_us_040_00_5m.json'),
])
  .then(myVis)
  .catch(e => {
    console.log(e);
  });

function myVis(data) {
  // Static map elements
  const [visData, geoData] = data;

  console.log(visData);

  const grouped = Object.values(
    visData.reduce((acc, row) => {
      if (!acc[row['state']]) {
        acc[row['state']] = {
          state: row['state'],
          count: 0,
          lat: 0,
          long: 0,
        };
      }
      acc[row['state']] = {
        state: row['state'],
        count: acc[row['state']].count + 1,
        lat: row['lat'],
        long: row['long'],
      };
      return acc;
    }, {}),
  );

  const mapWidth = 700;
  const mapHeight = 600;
  const mapMargin = {top: 0, bottom: 0, left: 0, right: 0};

  const quantizeScale = scaleQuantize()
    .domain([0, 140])
    .range([2, 4, 8, 14, 32]);

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
    .scale(950)
    .translate([mapWidth / 2, mapHeight / 2]);

  const myGeoPath = geoPath(projection);

  select('#map-paths')
    .selectAll('path')
    .data(geoData.features)
    .join('path')
    .attr('fill', '#4C5454')
    .attr('stroke', '#F8F4F9')
    .attr('d', myGeoPath);

  select('#map-paths')
    .selectAll('circle')
    .data(grouped.filter(el => el.lat))
    .join('circle')
    .attr('class', 'state-circles')
    .attr('id', d => d.state)
    .attr('fill', '#FF715B')
    .attr('opacity', 0.8)
    .attr('cx', d => {
      if (d.long) return projection([d.long, d.lat])[0];
    })
    .attr('cy', d => {
      return d.long ? projection([d.long, d.lat])[1] : null;
    })
    .attr('r', d => quantizeScale(d.count));

  selectAll('.state-circles').on('click', event => {
    console.log(event.target);
    const targetData = event.target['__data__'];
    select('.selected-circle')
      .attr('fill', '#FF715B')
      .attr('class', 'state-circles');
    select(`#${event.target.id}`)
      .attr('fill', '#76B041')
      .attr('class', 'selected-circle state-circles');
  });
}

function barChart(data, state) {
  const bcHeight = 300;
  const bcWidth = 300;
  const bcMargin = {top: 10, bottom: 20, left: 50, right: 5};
  const bcPlotHeight = bcHeight - bcMargin.top - bcMargin.bottom;
  const bcPlotWidth = bcWidth - bcMargin.left - bcMargin.right;

  const stateData = data.filter(el => el.state == state);

  const grouped = stateData.reduce((acc, row) => {
    acc[row['search_count']] = (acc[row['search_count']] || 0) + 1;
  }, {});

  const bcSvg = select('#bar-chart')
    .append('svg')
    .attr('height', bcHeight)
    .attr('width', bcWidth)
    .append('g')
    .attr('transform', `translate(${bcMargin.left}, ${bcMargin.top})`);

  const bcXAxis = bcSvg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${bcPlotHeight})`);

  const bcYAxis = bcSvg.append('g').attr('class', 'y-axis');

  bcSvg
    .append('g')
    .attr('class', 'y-axis-label')
    .attr('transform', `translate(-40, ${bcPlotHeight / 2})`)
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Percentage');

  bcSvg.append('g').attr('class', 'rect-container');
}
