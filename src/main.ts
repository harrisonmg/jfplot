'use strict';

import * as Plotly from 'plotly.js-dist';
import * as Papa from 'papaparse';

type CSVRow = { [key: string]: any };
type CSV = Papa.ParseResult<CSVRow>;

const dfs: { [key: string]: CSV } = {};

let seriesCounter = 0;
let defaultSeries: HTMLElement = null;

let firstFile = true;
let firstTrace = true;

const fileInstruction = 'Add CSV files by dragging and dropping anywhere.';
const traceInstruction = 'Select a file, x column and y column to plot a series.';

const default_layout: Partial<Plotly.Layout> = {
  title: fileInstruction,
  xaxis: { title: '', automargin: true, },
  yaxis: { title: '', automargin: true, },
};

const default_plot_options: Partial<Plotly.Config> = {
  scrollZoom: true,
  editable: true,
  modeBarButtonsToRemove: ['lasso2d'],
  responsive: true
};

const default_trace: Partial<Plotly.PlotData> = {
     mode: 'lines',
     type: 'scattergl',
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

  for (const traceSelect of series.querySelectorAll('.trace-update')) {
   traceSelect.addEventListener('change', () => {
     updateTrace(series);
   });
  }

  for (const markerCheckbox of series.querySelectorAll('.marker-checkbox')) {
   markerCheckbox.addEventListener('click', () => {
     updateMarkers(series);
   });
  }

  series.querySelector('.subplot-checkbox')
    .addEventListener('click', () => {
      updateAxes();
    })

  series.querySelector('.remove-series-button')
    .addEventListener('click', () => {
      removeSeries(series);
  });

  series.querySelector('.default-series-checkbox')
    .addEventListener('click', () => {
      updateDefault(series);
  });

  updateSeries(series);
  document.querySelector('.series-box').appendChild(seriesNode);
  Plotly.addTraces('plot', default_trace);

  if (defaultSeries != null) {
    const setDefaultSelect = (selector: string) => {
      const select: HTMLSelectElement = series.querySelector(selector);
      const defaultSelect: HTMLSelectElement = defaultSeries.querySelector(selector);
      select.value = defaultSelect.value;
      select.dispatchEvent(new Event('change'));
    }

    setDefaultSelect('.file-select');
    setDefaultSelect('.x-select');
    setDefaultSelect('.y-select');

    const setDefaultCheckbox = (selector: string) => {
      const checkbox: HTMLInputElement = series.querySelector(selector);
      const defaultCheckbox: HTMLInputElement = defaultSeries.querySelector(selector);
      checkbox.checked = defaultCheckbox.checked;
      checkbox.dispatchEvent(new Event('click'));
    }

    setDefaultCheckbox('.line-checkbox');
    setDefaultCheckbox('.scatter-checkbox');
    setDefaultCheckbox('.subplot-checkbox');

    const setDefaultValue = (selector: string) => {
      const input: HTMLInputElement = series.querySelector(selector);
      const defaultInput: HTMLInputElement = defaultSeries.querySelector(selector);
      input.value = defaultInput.value;
      input.dispatchEvent(new Event('change'));
    }

    setDefaultValue('.x-transform-scale');
    setDefaultValue('.x-transform-offset');
    setDefaultValue('.y-transform-scale');
    setDefaultValue('.y-transform-offset');
  }

  updateAdvanced();
};

const updateDefault = (series: HTMLElement) => {
  const checkbox = series.querySelector('.default-series-checkbox') as HTMLInputElement;
  if (checkbox.checked) {
    defaultSeries = series;
    for (const otherCheckbox of document.querySelectorAll('.default-series-checkbox') as NodeListOf<HTMLInputElement>) {
      if (otherCheckbox != checkbox) {
        otherCheckbox.checked = false;
      }
    }
  } else if (defaultSeries == series) {
    defaultSeries = null;
  }
}

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

    updateAxes();
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

    // start with one series by default
    addSeries();

    (document.querySelector('#loading') as HTMLElement).style.display = 'none';

    // add middle click pan
    plot.addEventListener('mousedown', (event: any) => {
      let plot: any = document.querySelector('.js-plotly-plot');
      plot._fullLayout.dragmode = event.buttons == 4 ? 'pan' : 'zoom';
    }, true);
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

  if (fileSelect.value === '') {
    return;
  }

  const field_dict = dfs[fileSelect.value].meta.fields;
  // @ts-ignore
  const fields = Object.keys(field_dict).map((key) => field_dict[key]);

  updateSelect(xSelect, fields);
  updateSelect(ySelect, fields);

  if (xSelect.value === '') {
    xSelect.value = fields[0];
  }
};

const transformData = (data: number[], scale: number, offset: number) => {
  if (isNaN(scale) && isNaN(offset)) {
    return data;
  }

  if (isNaN(scale)) {
    scale = 1;
  }

  if (isNaN(offset)) {
    offset = 0;
  }

  return data.map((datum: number) => datum * scale + offset);
}

const updateTrace = (series: HTMLElement) => {
  const file = (series.querySelector('.file-select') as HTMLSelectElement).value;
  const x_label = (series.querySelector('.x-select') as HTMLSelectElement).value;
  const y_label = (series.querySelector('.y-select') as HTMLSelectElement).value;

  if (file !== '' && x_label !== '' && y_label !== '') {
    if (firstTrace) {
      Plotly.relayout('plot', {title: ''});
    }
    firstTrace = false;

    const xScale = parseFloat((series.querySelector('.x-transform-scale') as HTMLInputElement).value);
    const xOffset = parseFloat((series.querySelector('.x-transform-offset') as HTMLInputElement).value);

    const yScale = parseFloat((series.querySelector('.y-transform-scale') as HTMLInputElement).value);
    const yOffset = parseFloat((series.querySelector('.y-transform-offset') as HTMLInputElement).value);

    const trace_data = dfs[file].data;

    trace_data.sort((a, b) => {
      const ax = a[x_label];
      const bx = b[x_label];
       return ax < bx ? -1 :
              ax > bx ? 1 :
              0;
    })

    let x_data = [];
    let y_data = [];
    for (let i = 0; i < trace_data.length; i++) {
      const x = trace_data[i][x_label];
      const y = trace_data[i][y_label];
      if (x !== null && y !== null) {
        x_data.push(x);
        y_data.push(y);
      }
    }

    const trace = {
      x: [transformData(x_data, xScale, xOffset)],
      y: [transformData(y_data, yScale, yOffset)],
    }

    const index = parseInt(series.getAttribute('index'));
    Plotly.restyle('plot', trace, index);
    updateAxes();
  }
};

const updateMarkers = (series: HTMLElement) => {
  const index = parseInt(series.getAttribute('index'));
  const line = (series.querySelector('.line-checkbox') as HTMLInputElement).checked;
  const scatter = (series.querySelector('.scatter-checkbox') as HTMLInputElement).checked;

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

const updateAxes = () => {
  let layout: Partial<Plotly.Layout> = {
    grid: {
        rows: 1,
        columns: 1,
    }
  }

  for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
    const index = parseInt(series.getAttribute('index'));
    const subplot = (series.querySelector('.subplot-checkbox') as HTMLInputElement).checked;

    let yaxis = 'y';
    if (subplot) {
      layout.grid.rows += 1;
      yaxis += layout.grid.rows;
      // @ts-ignore
      layout['yaxis' + layout.grid.rows] = { title: '', automargin: true };
    }

    Plotly.restyle('plot', { yaxis: yaxis }, index);
  }

  Plotly.relayout('plot', layout);
};

// file management //

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
        let file_replaced = file.name in dfs;
        dfs[file.name] = result;

        for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
          updateSeries(series);

          if (file_replaced) {
            const file_choice = (series.querySelector('.file-select') as HTMLSelectElement).value;
            if (file_choice === file.name) {
              updateColumns(series);
              updateTrace(series);
            }
          }
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

// advanced options //

const advanced = document.querySelector('#advanced-checkbox') as HTMLInputElement;

const updateAdvanced = () => {
  const checked = advanced.checked;
  for (const option of document.querySelectorAll('.advanced-series-option') as NodeListOf<HTMLElement>) {
    option.hidden = !checked;
  }
}

advanced.addEventListener('click', updateAdvanced);

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
