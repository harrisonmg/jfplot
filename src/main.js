'use strict';

import Plotly from 'plotly.js-dist';
import * as dfd from 'danfojs';

const dfs = {};
const traces = {};
let seriesCounter = 0;

const updateSelect = (select, options) => {
  const selection = select.value;

  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  for (const label in options) {
    const option = document.createElement('option');
    option.value = label;
    option.innerText = label;
    select.appendChild(option);
  }

  if (selection in options) {
    select.value = selection;
  } else {
    select.value = '';
  }
};

const addSeries = () =>
{
  const template = document.querySelector('#series-template');
  const series = template.content.cloneNode(true);
  // series is a Node, can't set id unless it's an Element
  series.id = 'series-' + seriesCounter;
  seriesCounter++;
  series.querySelector('.file-select')
    .addEventListener('change', (event) => {
      updateColumns(event.target.parentElement);
    });
  for (const traceSelect of series.querySelectorAll('.trace-select')) {
    traceSelect.addEventListener('change', (event) => {
      updateTrace(event.target.parentElement);
    });
  }
  updateSeries(series);
  document.querySelector('body').appendChild(series);
};

const updateSeries = (series) => {
  const fileSelect = series.querySelector('.file-select');
  updateSelect(fileSelect, dfs);
};

const updateColumns = (series) => {
  const fileSelect = series.querySelector('.file-select');
  for (const traceSelect of series.querySelectorAll('.trace-select')) {
    updateSelect(traceSelect, dfs[fileSelect.value]);
  }
};

const updateTrace = (series) => {
  const file = series.querySelector('.file-select').value;
  const x = series.querySelector('.x-select').value;
  const y = series.querySelector('.y-select').value;
  if ('' in [file, x, y]) {
    traces[series.id] = {};
  } else {
    traces[series.id] = {
     x: dfs[file][x],
     y: dfs[file][y],
     mode: 'markers'
    }
  }
  console.log(traces);
  console.log(Object.values(traces));
  Plotly.react('plot', Object.values(traces));
};

document.querySelector('#add-series-button')
 .addEventListener('click', () => {
   addSeries();
 });

document.querySelector('#file-input')
  .addEventListener('change', (event) => {
    for (const file of event.target.files) {
      const filename = file.name.split('\\').slice(-1);
      dfd.readCSV('./' + filename).then((df) => {
        df = dfd.toJSON(df, { format: 'row' });
        dfs[filename] = df;
        for (const series of document.querySelectorAll('.series')) {
          updateSeries(series);
        }
      })
    }
  });

const layout = {
  title: ''
};

const plot_options = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
};

Plotly.newPlot('plot', [], layout, plot_options);
addSeries();
