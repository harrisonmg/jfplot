'use strict';

import Plotly from 'plotly.js-dist'

let plot = document.getElementById('plot');
let plot_options = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
}

Plotly.newPlot(plot, [{
       x: [1, 2, 3, 4, 5],
       y: [1, 2, 4, 8, 16] }], {
       margin: { t: 0 } } );
