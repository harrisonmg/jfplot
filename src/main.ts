'use strict';

import * as Plotly from 'plotly.js-dist';
import * as Papa from 'papaparse';

type CSVObject = { [key: string]: any[] };
type CSVRow = { [key: string]: any };

const dfs: { [key: string]: CSVObject } = {};

let seriesCounter = 0;
let firstFile = true;
let firstTrace = true;

const fileInstruction = 'Add files by dragging and dropping anywhere.';
const traceInstruction = 'Select a file, x column and y column to plot a series.';

const default_layout: Partial<Plotly.Layout> = {
  title: fileInstruction,
  xaxis: { title: '' },
  yaxis: { title: '' },
  yaxis2: {
    title: '',
    overlaying: 'y',
    side:'right'
  }
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

// series management //

const addSeries = () =>
{
  const template = document.querySelector('#series-template') as HTMLTemplateElement;
  const seriesNode = template.content.cloneNode(true);
  const series = (seriesNode as HTMLElement).querySelector('div');

  series.setAttribute('index', (seriesCounter++).toString());

  series.querySelector('.file-select')
   .addEventListener('change', () => {
     updateColumns(series);
     updateTrace(series);
   });

  for (const traceSelect of series.querySelectorAll('.trace-select')) {
   traceSelect.addEventListener('change', () => {
     updateTrace(series);
   });
  }

  for (const markerCheckbox of series.querySelectorAll('.marker-checkbox')) {
   markerCheckbox.addEventListener('click', () => {
     updateMarkers(series);
   });
  }

  series.querySelector('.y2-checkbox')
    .addEventListener('click', () => {
      updateAxis(series);
    })

  series.querySelector('.remove-series-button')
    .addEventListener('click', () => {
      removeSeries(series);
  });

  updateSeries(series);
  document.querySelector('.series-box').appendChild(seriesNode);
  Plotly.addTraces('plot', default_trace);
};

const removeSeries = (series: HTMLElement) => {
  if (seriesCounter > 0) {
    seriesCounter--;

    const index = parseInt(series.getAttribute('index'));
    series.remove();
    Plotly.deleteTraces('plot', [index]);

    for (const otherSeries of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
      const oldIndex = parseInt(otherSeries.getAttribute('index'));
      if (oldIndex > index) {
        otherSeries.setAttribute('index', (oldIndex - 1).toString());
        updateTrace(otherSeries);
      }
    }
  }
};

document.querySelector('#add-series-button')
 .addEventListener('click', () => {
   addSeries();
 });

// plot creation //

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
    (document.querySelector('#loading') as HTMLElement).style.display = 'none';
  });

const observer = new MutationObserver(() => {
  window.dispatchEvent(new Event('resize'));
});

observer.observe(document.querySelector('#plot'), {attributes: true});

// series updates //

const updateSelect = (select: HTMLSelectElement, options: string[]) => {
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

const updateTrace = (series: HTMLElement) => {
  const index = parseInt(series.getAttribute('index'));
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

    Plotly.restyle('plot', trace, index);
  }
};

const updateMarkers = (series: HTMLElement) => {
  const index = parseInt(series.getAttribute('index'));
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

const updateAxis = (series: HTMLElement) => {
  const index = parseInt(series.getAttribute('index'));
  const y2 = (series.querySelector('.y2-checkbox') as HTMLInputElement).checked;

  let yaxis = '';
  if (y2) {
    yaxis = 'y2';
  }

  Plotly.restyle('plot', {yaxis: yaxis}, index);
};

// file management //

const transpose = (result: Papa.ParseResult<CSVRow>): CSVObject => {
 const ret: CSVObject = {};

 for (const field of result.meta.fields) {
   ret[field] = [];
 }

 for (const row of result.data) {
   for (const field of Object.keys(row)) {
     ret[field].push(row[field]);
   }
 }

 return ret;
};

const addFile = (file: File) => {
  if (firstFile) {
    Plotly.relayout('plot', {title: traceInstruction})
  }
  firstFile = false;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    download: true,
    comments: '#',
    complete: (result: Papa.ParseResult<CSVRow>) => {
      if (result.errors.length > 0) {
        const error = JSON.stringify(result.errors[0], null, 4);
        alert(`Failed to load file "${file.name}":\n${error}`);
      } else {
        dfs[file.name] = transpose(result);
        for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
          updateSeries(series);
        }
      }
    },
  });
};

document.querySelector('#file-input')
  .addEventListener('change', (event) => {
    for (const file of (event.target as HTMLInputElement).files) {
      addFile(file);
    }
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

// help modal //

const helpModal = document.querySelector('#help-modal') as HTMLElement;

document.querySelector('#help-button').addEventListener('click', () => {
  helpModal.style.display = 'flex';
});

document.querySelector('#help-close').addEventListener('click', () => {
  helpModal.style.display = 'none';
});

window.addEventListener('click', (event: MouseEvent) => {
  if (event.target == helpModal) {
    helpModal.style.display = 'none';
  }
});
