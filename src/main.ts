'use strict';

import * as Plotly from 'plotly.js-dist';
import * as dfd from 'danfojs';

type CSV = { [key: string]: any };

const dfs: { [key: string]: CSV } = {};
const traces: { [key: string]: Partial<Plotly.PlotData> } = {};
let seriesCounter: number = 0;

const layout: Partial<Plotly.Layout> = {
  title: ''
};

const plot_options: Partial<Plotly.Config> = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
};

const addSeries = () =>
{
  const template = document.querySelector('#series-template') as HTMLTemplateElement;
  const seriesNode = template.content.cloneNode(true);
  const series = (seriesNode as HTMLElement).querySelector('div');
  series.id = 'series-' + seriesCounter;
  seriesCounter++;
  series.querySelector('.file-select')
   .addEventListener('change', () => {
     updateColumns(series);
   });
  for (const traceSelect of series.querySelectorAll('.trace-select')) {
   traceSelect.addEventListener('change', () => {
     updateTrace(series);
   });
  }
  updateSeries(series);
  document.querySelector('body').appendChild(seriesNode);
};

const updateSelect = (select: HTMLSelectElement, options: Array<string>) => {
  const selection = select.value;

  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  for (const label of options) {
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

const updateSeries = (series: HTMLElement) => {
  const fileSelect = series.querySelector('.file-select') as HTMLSelectElement;
  updateSelect(fileSelect, Object.keys(dfs));
};

const updateColumns = (series: HTMLElement) => {
  const fileSelect = series.querySelector('.file-select') as HTMLSelectElement;
  const xSelect = series.querySelector('.x-select') as HTMLSelectElement;
  const ySelect = series.querySelector('.y-select') as HTMLSelectElement;

  const keys = Object.keys(dfs[fileSelect.value]);

  updateSelect(xSelect, keys);
  updateSelect(ySelect, keys);

  if (xSelect.value === '') {
    xSelect.value = keys[0];
  }
};

const updateTrace = (series: HTMLElement) => {
  const file = (series.querySelector('.file-select') as HTMLSelectElement).value;
  const x = (series.querySelector('.x-select') as HTMLSelectElement).value;
  const y = (series.querySelector('.y-select') as HTMLSelectElement).value;
  if (file !== '' && x !== '' && y !== '') {
    traces[series.id] = {
     x: dfs[file][x],
     y: dfs[file][y],
     mode: 'markers'
    }
  }
  Plotly.react('plot', Object.values(traces), layout, plot_options);
};

document.querySelector('#add-series-button')
 .addEventListener('click', () => {
   addSeries();
 });

document.querySelector('#file-input')
  .addEventListener('change', (event) => {
    for (const file of (event.target as HTMLInputElement).files) {
      const filename = file.name.split('\\').slice(-1)[0];
      dfd.readCSV('./' + filename).then((df) => {
        const dfJson = dfd.toJSON(df, { format: 'row' }) as CSV;
        dfs[filename] = dfJson;
        for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
          updateSeries(series);
        }
      })
    }
  });

Plotly.newPlot('plot', [], layout, plot_options);
addSeries();
