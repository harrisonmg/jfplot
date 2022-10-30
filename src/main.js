'use strict';

import Plotly from 'plotly.js-dist'

let data = [{
  x: [1, 2, 3, 4, 5],
  y: [1, 2, 4, 8, 16]
}];

let layout = {
  title: ''
}

let plot_options = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
}

Plotly.newPlot('plot', data, layout, plot_options);
