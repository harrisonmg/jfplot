'use strict';

import Plotly from 'plotly.js-dist';
import * as dfd from 'danfojs';

const dfs = {};

const layout = {
  title: ''
};

const plot_options = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
};

const updateSelect = (select, options) => {
  console.log(select);
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  for (const label in options) {
    const option = document.createElement('option');
    option.value = label;
    option.innerText = label;
    select.appendChild(option);
  }
};

const addSeries = () =>
{
  const template = document.querySelector('#series-template');
  const series = template.content.cloneNode(true);
  // TODO add event listener for file select to populate x and y here
  updateSeries(series);
  document.querySelector('body').appendChild(series);
};

const updateSeries = (series) =>
{
  let fileSelect = series.querySelector('.file-select');
  updateSelect(fileSelect, dfs);
};

document.getElementById('add-series-button')
 .addEventListener('click', () => {
   addSeries();
 });

document.getElementById('file-input')
  .addEventListener('change', (event) => {
    const filename = event.target.value.split('\\').slice(-1);
    dfd.readCSV('./' + filename).then((df) => {
      df = dfd.toJSON(df, { format: 'row' });
      dfs[filename] = df;
      for (const series of document.querySelectorAll('.series')) {
        updateSeries(series);
      }

      //const traces = [{
      //  x: df['time'],
      //  y: df['current_distance'],
      //  mode: 'markers'
      //}]
      //Plotly.react('plot', traces);
    })
  });

Plotly.newPlot('plot', [], layout, plot_options);
addSeries();
