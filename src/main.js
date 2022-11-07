'use strict';

import Plotly from 'plotly.js-dist';
import * as dfd from 'danfojs';

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

document.getElementById('btn')
  .addEventListener('click', () => {
  });

const fileList = document.getElementById('file-list');

document.getElementById('file-input')
  .addEventListener('change', (event) => {
    const filename = event.target.value.split('\\').slice(-1);
    const li = document.createElement('li');
    li.innerText = filename;
    fileList.appendChild(li);
    dfd.readCSV('./' + filename).then((df) => {
      df = dfd.toJSON(df, { format: 'row' });
      const traces = [{
        x: df['time'],
        y: df['current_distance'],
        mode: 'markers'
      }]
      Plotly.react('plot', traces);
    })
  });
