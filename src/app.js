import {select, selectAll} from 'd3-selection';
import {geoPath, geoAlbersUsa} from 'd3-geo';
import {json} from 'd3-fetch';
import {scaleQuantize, scaleBand, scaleLinear, scaleSymlog} from 'd3-scale';
import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {transition} from 'd3-transition';

import './main.css';

Promise.all([
  json('./notebooks/data/clearview_ai_data.json'),
  json('./data/gz_2010_us_040_00_5m.json'),
])
  .then(myVis)
  .catch(e => {
    console.log(e);
  });

// main function

function myVis(data) {
  const [visData, geoData] = data;

  // prep map data

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

  // Map elements

  const mapWidth = 700;
  const mapHeight = 475;
  const mapMargin = {top: 0, bottom: 0, left: 0, right: 0};

  const quantizeScale = scaleQuantize()
    .domain([0, 140])
    .range([2, 4, 8, 12, 18, 26, 36]);

  const mapContainer = select('#map')
    .append('div')
    .attr('class', 'map-container');

  mapContainer
    .append('svg')
    .attr('height', mapHeight)
    .attr('width', mapWidth)
    .append('g')
    .attr('id', 'map-paths')
    .attr('transform', `translate(${mapMargin.left}, ${mapMargin.top})`);

  const tooltip = mapContainer
    .append('div')
    .attr('id', 'tooltip')
    .style('display', 'none');

  const projection = geoAlbersUsa()
    .scale(950)
    .translate([mapWidth / 2, mapHeight / 2]);

  const myGeoPath = geoPath(projection);

  // Plot the map

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
    .attr('opacity', 0.7)
    .attr('cx', d => (d.long ? projection([d.long, d.lat])[0] : null))
    .attr('cy', d => (d.long ? projection([d.long, d.lat])[1] : null))
    .attr('r', d => quantizeScale(d.count))
    .on('mouseenter', (e, d) => {
      let name = d.state;
      let c = d.count;
      console.log([d]);

      select('#tooltip > div').remove();

      tooltip
        .style('display', 'block')
        .style('left', `${e.clientX}px`)
        .style('top', `${e.clientY}px`)
        .style('background-color', '#FFC914')
        .append('div')
        .text(`${name} - ${c} agencies`);

      select(e.target)
        .transition()
        .duration(300)
        .attr('opacity', 0.9)
        .attr('stroke', 'white')
        .attr('r', `${quantizeScale(d.count) + 7}`);
    })
    .on('mouseleave', (e, d) => {
      select(e.target)
        .transition()
        .duration(300)
        .attr('opacity', 0.7)
        .attr('stroke', 'none')
        .attr('r', `${quantizeScale(d.count)}`);
      select('#tooltip')
        .transition()
        .duration(300)
        .style('background-color', '#F8F4F9');

      let selected_state = select('.selected-circle').data()[0];
      console.log(selected_state);
      select('#tooltip > div').remove();
      tooltip
        .style('display', 'block')
        .style('left', `${e.clientX}px`)
        .style('top', `${e.clientY}px`)
        .style('background-color', '#FFC914')
        .append('div')
        .text(`${selected_state.state} - ${selected_state.count} agencies`);
    });

  // Bar chart elements

  const bcHeight = 350;
  const bcWidth = 550;
  const bcMargin = {top: 0, bottom: 40, left: 80, right: 10};
  const bcPlotHeight = bcHeight - bcMargin.top - bcMargin.bottom;
  const bcPlotWidth = bcWidth - bcMargin.left - bcMargin.right;

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
    .attr('transform', `translate(-60, ${bcPlotHeight / 2})`)
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Search Count per Agency');

  bcSvg
    .append('g')
    .attr('class', 'x-axis-label')
    .attr(
      'transform',
      `translate(${bcPlotWidth / 2}, ${bcPlotHeight + (bcMargin.bottom - 5)})`,
    )
    .append('text')
    .attr('text-anchor', 'middle')
    .text('No. of Agencies');

  const rectContainer = bcSvg.append('g').attr('class', 'rect-container');

  function barChart(data, state) {
    // remove current chart title first
    select('#bar-chart-title > h2').remove();
    select('#bar-chart-title')
      .append('h2')
      .text(
        `How Often Did Agencies in ${state} Allegedly Search Clearview AI's Face Database?`,
      );

    select('#bar-chart').attr('hidden', null);

    const t = transition().duration(500);

    const stateData = data.filter(el => el.state == state);

    console.log(stateData);

    const grouped = Object.entries(
      stateData.reduce((acc, row) => {
        acc[row['search_count']] = (acc[row['search_count']] || 0) + 1;
        return acc;
      }, {}),
    ).map(([cntRange, cnt]) => ({cntRange, cnt}));

    const xDomain = extent(grouped, d => d.cnt);

    const yScale = scaleBand()
      .domain([
        '1-5',
        '6-10',
        '11-50',
        '51-100',
        '101-500',
        '501-1000',
        '1001-5000',
        '5001+',
      ])
      .range([0, bcPlotHeight]);

    const xScale = scaleLinear()
      .domain([0, xDomain[1]])
      .range([0, bcPlotWidth]);

    // Table
    select('#table-title > h2').remove();
    select('#table-title')
      .append('h2')
      .text(`Agencies in ${state} Reported to Use Clearview AI`);

    select('table').attr('hidden', null);

    select('tbody')
      .selectAll('tr')
      .data(
        stateData.map(({org, search_count, comment}) => ({
          org,
          search_count,
          comment,
        })),
      )
      .join('tr')
      .selectAll('td')
      .data((d, i) => Object.values(d))
      .join('td')
      .text(d => d);

    function updateBarChart(grouped) {
      rectContainer
        .selectAll('rect')
        .data(grouped)
        .join(
          enter =>
            enter
              .append('rect')
              .attr('x', 0)
              .attr('width', d => xScale(d.cnt))
              .attr('y', d => yScale(d.cntRange)),
          update =>
            update.call(el =>
              el
                .transition(t)
                .attr('x', 0)
                .attr('width', d => xScale(d.cnt))
                .attr('y', d => yScale(d.cntRange)),
            ),
        )
        .attr('fill', '#17BEBB')
        .attr('stroke', 'white')
        .attr('height', yScale.bandwidth());

      bcXAxis.call(axisBottom(xScale));
      bcYAxis.call(axisLeft(yScale));
    }
    updateBarChart(grouped);
  }

  selectAll('.state-circles').on('click', event => {
    console.log(event.target);
    const targetData = event.target['__data__'];
    select('.selected-circle')
      .attr('fill', '#FF715B')
      .attr('class', 'state-circles');
    select(`#${event.target.id}`)
      .attr('fill', '#76B041')
      .attr('class', 'selected-circle state-circles');

    barChart(visData, targetData.state);
  });
}
