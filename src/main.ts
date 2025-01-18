'use strict';

import * as Plotly from 'plotly.js-dist';
import * as Papa from 'papaparse';

type CSVRow = { [key: string]: any };
type CSV = Papa.ParseResult<CSVRow>;

const dfs: { [key: string]: CSV } = {};

let series_counter = 0;
let default_series: HTMLElement = null;
let max_plots = 1;

let first_file = true;
let first_trace = true;

const file_instruction = 'Add CSV files by dragging and dropping anywhere.';
const trace_instruction = 'Select a file, x column and y column to plot a series.';

const default_layout: Partial<Plotly.Layout> = {
  // @ts-ignore
  title: { text: file_instruction, subtitle: { text: '' } },
  xaxis: { title: '', automargin: true, },
  yaxis: { title: '', automargin: true, },
  hovermode: 'x',
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

const addSeries = () => {
  const template = document.querySelector('#series-template') as HTMLTemplateElement;
  const seriesNode = template.content.cloneNode(true);
  const series = (seriesNode as HTMLElement).querySelector('div');

  series.setAttribute('index', (series_counter++).toString());

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

  const plot_1_button = series.querySelector('.plot-1-button') as HTMLButtonElement;
  const plot_2_button = series.querySelector('.plot-2-button') as HTMLButtonElement;
  const plot_3_button = series.querySelector('.plot-3-button') as HTMLButtonElement;
  const plot_4_button = series.querySelector('.plot-4-button') as HTMLButtonElement;
  const plot_other = series.querySelector('.plot-other') as HTMLInputElement;

  const buttonOn = (button: HTMLButtonElement) => {
    button.style.color = "black";
    button.style.fontWeight = "bold";
  }

  const buttonOff = (button: HTMLButtonElement) => {
    button.style.color = "grey";
    button.style.fontWeight = "normal";
  }

  const otherOn = () => {
    plot_other.style.color = "black";
    plot_other.style.fontWeight = "bold";
  }

  const otherOff = () => {
    plot_other.style.color = "grey";
    plot_other.style.fontWeight = "normal";
  }

  const setPlot = (plot: number) => {
    buttonOff(plot_1_button);
    buttonOff(plot_2_button);
    buttonOff(plot_3_button);
    buttonOff(plot_4_button);
    otherOff();

    series.setAttribute('prev_plot_num', '0');
    series.setAttribute('plot_num', plot.toString());

    if (plot == 1) {
      buttonOn(plot_1_button);
    } else if (plot == 2) {
      buttonOn(plot_2_button);
    } else if (plot == 3) {
      buttonOn(plot_3_button);
    } else if (plot == 4) {
      buttonOn(plot_4_button);
    } else {
      otherOn();
    }
  }

  const plots: Array<number> = [];
  for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
    plots.push(parseInt(series.getAttribute('plot_num')));
  }
  const plot_num = plots.length == 0 ? 1 : Math.max(...plots) + 1;
  setPlot(plot_num);
  if (plot_num > 5) {
    plot_other.value = plot_num.toString();
  }

  plot_1_button.addEventListener('click', () => {
    setPlot(1);
    updateAxes();
  })

  plot_2_button.addEventListener('click', () => {
    setPlot(2);
    updateAxes();
  })

  plot_3_button.addEventListener('click', () => {
    setPlot(3);
    updateAxes();
  })

  plot_4_button.addEventListener('click', () => {
    setPlot(4);
    updateAxes();
  })

  const other_event = () => {
    const plot_num = intMin1(parseInt(plot_other.value));
    plot_other.value = plot_num.toString();
    setPlot(plot_num);
    updateAxes();
  }

  plot_other.addEventListener('click', other_event);
  plot_other.addEventListener('change', other_event);

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

  if (default_series != null) {
    const setDefaultSelect = (selector: string) => {
      const select: HTMLSelectElement = series.querySelector(selector);
      const defaultSelect: HTMLSelectElement = default_series.querySelector(selector);
      select.value = defaultSelect.value;
    }

    setDefaultSelect('.file-select');
    setDefaultSelect('.x-select');
    setDefaultSelect('.y-select');

    const setDefaultCheckbox = (selector: string) => {
      const checkbox: HTMLInputElement = series.querySelector(selector);
      const defaultCheckbox: HTMLInputElement = default_series.querySelector(selector);
      checkbox.checked = defaultCheckbox.checked;
    }

    setDefaultCheckbox('.line-checkbox');
    setDefaultCheckbox('.scatter-checkbox');
    setDefaultCheckbox('.zero-x-checkbox');

    setPlot(parseInt(default_series.getAttribute('plot_num')));

    const setDefaultValue = (selector: string) => {
      const input: HTMLInputElement = series.querySelector(selector);
      const defaultInput: HTMLInputElement = default_series.querySelector(selector);
      input.value = defaultInput.value;
    }

    setDefaultValue('.x-transform-scale');
    setDefaultValue('.x-transform-offset');
    setDefaultValue('.y-transform-scale');
    setDefaultValue('.y-transform-offset');
    setDefaultValue('.downsample');

    updateColumns(series);
    updateTrace(series);
    updateMarkers(series);
  }

  updateAxes();
  updateAdvanced();
};

const updateDefault = (series: HTMLElement) => {
  const checkbox = series.querySelector('.default-series-checkbox') as HTMLInputElement;
  if (checkbox.checked) {
    default_series = series;
    for (const otherCheckbox of document.querySelectorAll('.default-series-checkbox') as NodeListOf<HTMLInputElement>) {
      if (otherCheckbox != checkbox) {
        otherCheckbox.checked = false;
      }
    }
  } else if (default_series == series) {
    default_series = null;
  }
}

const removeSeries = (series: HTMLElement) => {
  if (series_counter > 0) {
    series_counter--;

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
        (first_file || first_trace) &&
        'title.text' in event &&
        event['title.text'] !== file_instruction &&
        event['title.text'] !== trace_instruction
      ) {
        first_file = false;
        first_trace = false;
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

const transformData = (data: number[], scale: number, offset: number, zero: boolean) => {
  if (isNaN(scale) && isNaN(offset) && !zero) {
    return data;
  }

  if (isNaN(scale)) {
    scale = 1;
  }

  if (isNaN(offset)) {
    offset = 0;
  }

  if (zero && data.length > 0) {
    offset -= data[0] * scale;
  }

  return data.map((datum: number) => datum * scale + offset);
}

const intMin1 = (val: number) => {
    if (isNaN(val) || val < 1) {
      val = 1;
    }
    return val;
}

const updateTrace = (series: HTMLElement) => {
  const file = (series.querySelector('.file-select') as HTMLSelectElement).value;
  const x_label = (series.querySelector('.x-select') as HTMLSelectElement).value;
  const y_label = (series.querySelector('.y-select') as HTMLSelectElement).value;

  if (file == '' && x_label == '' && y_label == '') {
    return;
  }

  if (first_trace) {
    // @ts-ignore
    Plotly.relayout('plot', {title: {text: '', subtitle: { text: '' }}});
  }
  first_trace = false;

  const x_scale = parseFloat((series.querySelector('.x-transform-scale') as HTMLInputElement).value);
  let x_offset = parseFloat((series.querySelector('.x-transform-offset') as HTMLInputElement).value);

  const y_scale = parseFloat((series.querySelector('.y-transform-scale') as HTMLInputElement).value);
  const y_offset = parseFloat((series.querySelector('.y-transform-offset') as HTMLInputElement).value);

  const downsample = series.querySelector('.downsample') as HTMLInputElement;
  const downsample_factor = intMin1(parseInt(downsample.value));
  downsample.value = downsample_factor.toString();

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
  for (let i = 0; i < trace_data.length; i += downsample_factor) {
    const x = trace_data[i][x_label];
    const y = trace_data[i][y_label];
    if (x !== null && y !== null) {
      x_data.push(x);
      y_data.push(y);
    }
  }

  const zero_x = (series.querySelector('.zero-x-checkbox') as HTMLInputElement).checked;

  const trace = {
    x: [transformData(x_data, x_scale, x_offset, zero_x)],
    y: [transformData(y_data, y_scale, y_offset, false)],
  }

  const index = parseInt(series.getAttribute('index'));
  Plotly.restyle('plot', trace, index);
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
  const plots: Array<number> = [];

  for (const series of document.querySelectorAll('.series') as NodeListOf<HTMLElement>) {
    const index = parseInt(series.getAttribute('index'));
    const prev_plot_num = parseInt(series.getAttribute('prev_plot_num'));
    const plot_num = parseInt(series.getAttribute('plot_num'));
    plots.push(plot_num);

    if (prev_plot_num != plot_num) {
      Plotly.restyle('plot', { yaxis: 'y' + plot_num }, index);
      series.setAttribute('prev_plot_num', plot_num.toString());
    }
  }

  const num_plots = Math.max(1, Math.max(...plots));

  let layout: Partial<Plotly.Layout> = {
    grid: {
        rows: num_plots,
        columns: 1,
    }
  }

  const new_max_plots = Math.max(max_plots, Math.max(...plots));

  for (let i = max_plots + 1; i <= new_max_plots; i += 1) {
    // @ts-ignore
    layout['yaxis' + i] = { title: '', automargin: true };
  }

  max_plots = new_max_plots;

  Plotly.relayout('plot', layout);
};

// file management //

const addFile = (file: File) => {
  if (first_file) {
    // @ts-ignore
    Plotly.relayout('plot', {title: {text: trace_instruction, subtitle: { text: '' }}});
  }
  first_file = false;

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
  for (const options of document.querySelectorAll('.advanced-series-options') as NodeListOf<HTMLElement>) {
    if (checked) {
     options.style.display = 'block';
    } else {
     options.style.display = 'none';
    }
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
