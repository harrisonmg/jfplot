'use strict';

import * as Plotly from 'plotly.js-dist';
import * as dfd from 'danfojs';

type CSV = { [key: string]: any };

const dfs: { [key: string]: CSV } = {};

let seriesCounter = 0;
let firstFile = true;
let firstTrace = true;

const fileInstruction = 'Add files by dragging and dropping anywhere.';
const traceInstruction = 'Select a file, x column and y column to plot a series.';

const default_layout: Partial<Plotly.Layout> = {
  title: fileInstruction,
  xaxis: { title: '' },
  yaxis: { title: '' }
};

const default_plot_options: Partial<Plotly.Config> = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
};

const default_trace: Partial<Plotly.PlotData> = {
     mode: 'markers'
};

const addSeries = () =>
{
  const template = document.querySelector('#series-template') as HTMLTemplateElement;
  const seriesNode = template.content.cloneNode(true);
  const series = (seriesNode as HTMLElement).querySelector('div');

  const index = seriesCounter++;
  series.id = 'series-' + index;

  series.querySelector('.file-select')
   .addEventListener('change', () => {
     updateColumns(series);
   });

  for (const traceSelect of series.querySelectorAll('.trace-select')) {
   traceSelect.addEventListener('change', () => {
     updateTrace(series, index);
   });
  }

  for (const markerCheckbox of series.querySelectorAll('.marker-checkbox')) {
   markerCheckbox.addEventListener('click', () => {
     updateMarkers(series, index);
   });
  }

  updateSeries(series);
  document.querySelector('body').appendChild(seriesNode);
  Plotly.addTraces('plot', default_trace);
};

const removeSeries = () => {
  if (seriesCounter > 1) {
    seriesCounter--;
    document.querySelector('#series-' + seriesCounter).remove();
    Plotly.deleteTraces('plot', [-1]);
  }
}

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

  if (options.includes(selection)) {
    select.value = selection;
  } else {
    select.value = '';
  }
};

const updateSeries = (series: HTMLElement) => {
  const fileSelect = series.querySelector('.file-select') as HTMLSelectElement;
  const keys = Object.keys(dfs);

  updateSelect(fileSelect, keys);

  if (fileSelect.value === '' && keys.length > 0) {
    fileSelect.value = keys[0];
    updateColumns(series);
  }
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

const updateTrace = (series: HTMLElement, index: number) => {
  const file = (series.querySelector('.file-select') as HTMLSelectElement).value;
  const x = (series.querySelector('.x-select') as HTMLSelectElement).value;
  const y = (series.querySelector('.y-select') as HTMLSelectElement).value;
  if (file !== '' && x !== '' && y !== '') {
    if (firstTrace) {
      Plotly.relayout('plot', {title: ''});
    }
    firstTrace = false;

    const trace = {
      x: [dfs[file][x]],
      y: [dfs[file][y]]
    }

    console.log(index);
    Plotly.restyle('plot', trace, index);
  }
};

const updateMarkers = (series: HTMLElement, index: number) => {
  const scatter = (series.querySelector('.scatter-checkbox') as HTMLInputElement).checked;
  const line = (series.querySelector('.line-checkbox') as HTMLInputElement).checked;

  let mode: Plotly.PlotData['mode'] = 'none';
  if (scatter) {
    if (line) {
      mode = 'lines+markers';
    } else {
      mode = 'markers';
    }
  } else if (line) {
    mode = 'lines';
  }
  Plotly.restyle('plot', {mode: mode}, index);
};

const addFile = (file: File) => {
  if (firstFile) {
    Plotly.relayout('plot', {title: traceInstruction})
  }
  firstFile = false;

  const filename = file.name.split('\\').slice(-1)[0];
  dfd.readCSV('./' + filename).then((df) => {
    const dfJson = dfd.toJSON(df, { format: 'row' }) as CSV;
    dfs[filename] = dfJson;
    for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
      updateSeries(series);
    }
  })
}

Plotly.newPlot('plot', [], default_layout, default_plot_options)
  .then((plot) => {
    plot.on('plotly_relayout', (event: any) => {
      if (
        (firstFile || firstTrace) &&
        'title.text' in event &&
        event['title.text'] !== fileInstruction &&
        event['title.text'] !== traceInstruction
      ) {
        firstFile = false;
        firstTrace = false;
      }
    });
    addSeries();
  });


document.querySelector('#add-series-button')
 .addEventListener('click', () => {
   addSeries();
 });

document.querySelector('.remove-series-button')
  .addEventListener('click', () => {
    removeSeries();
});

window.addEventListener('dragover', (event) => {
  event.preventDefault();
}, false);

window.addEventListener('drop', (event) => {
  event.preventDefault();
  if (event.dataTransfer.items) {
    for (const item of event.dataTransfer.items) {
      if (item.kind === 'file') {
        addFile(item.getAsFile());
      }
    }
  }
}, false);
