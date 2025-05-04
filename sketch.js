let parameters = [];
let sliderColors = [];

function getRandomColor() {
    // Generate a random bright color
    const r = Math.floor(100 + Math.random() * 155);
    const g = Math.floor(100 + Math.random() * 155);
    const b = Math.floor(100 + Math.random() * 155);
    return `rgb(${r},${g},${b})`;
}

function renderParameters() {
    const container = document.getElementById('sliders');
    container.innerHTML = '';
    container.style.position = '';
    container.style.top = '';
    container.style.left = '';
    container.style.width = '100%';
    container.style.height = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.background = '#181818';
    container.style.padding = '0';
    container.style.borderRadius = '0';
    container.style.marginTop = '0';
    container.style.boxShadow = 'none';

    const inner = document.createElement('div');
    inner.style.background = '#181818';
    inner.style.padding = '30px';
    inner.style.borderRadius = '12px';
    inner.style.boxShadow = '0 4px 24px #0008';
    inner.style.width = '100%';
    inner.style.maxWidth = '500px';
    inner.style.margin = '0 16px';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.alignItems = 'stretch';

    parameters.forEach((param, idx) => {
        if (!sliderColors[idx]) sliderColors[idx] = getRandomColor();
        const row = document.createElement('div');
        row.className = 'slider-container';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '18px';

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = param.name;
        nameInput.style.width = '90px';
        nameInput.style.marginRight = '10px';
        nameInput.style.background = '#222';
        nameInput.style.color = '#fff';
        nameInput.style.border = '1px solid #444';
        nameInput.style.borderRadius = '4px';
        nameInput.style.padding = '4px 8px';
        nameInput.addEventListener('change', () => {
            param.name = nameInput.value;
            saveParameters();
        });
        row.appendChild(nameInput);

        // Min input
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.value = param.min;
        minInput.style.width = '55px';
        minInput.style.marginRight = '5px';
        minInput.style.background = '#222';
        minInput.style.color = '#fff';
        minInput.style.border = '1px solid #444';
        minInput.style.borderRadius = '4px';
        minInput.style.padding = '4px 8px';
        minInput.addEventListener('change', () => {
            param.min = Number(minInput.value);
            if (param.value < param.min) param.value = param.min;
            saveParameters();
            renderParameters();
        });
        row.appendChild(minInput);

        // Slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = param.min;
        slider.max = param.max;
        slider.value = param.value;
        slider.style.flex = '1';
        slider.style.margin = '0 5px';
        slider.className = 'custom-slider';
        slider.setAttribute('data-idx', idx);
        slider.addEventListener('input', () => {
            param.value = Number(slider.value);
            valueLabel.innerText = slider.value;
            saveParameters();
        });
        row.appendChild(slider);

        // Max input
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.value = param.max;
        maxInput.style.width = '55px';
        maxInput.style.marginLeft = '5px';
        maxInput.style.background = '#222';
        maxInput.style.color = '#fff';
        maxInput.style.border = '1px solid #444';
        maxInput.style.borderRadius = '4px';
        maxInput.style.padding = '4px 8px';
        maxInput.addEventListener('change', () => {
            param.max = Number(maxInput.value);
            if (param.value > param.max) param.value = param.max;
            saveParameters();
            renderParameters();
        });
        row.appendChild(maxInput);

        // Value label
        const valueLabel = document.createElement('span');
        valueLabel.innerText = param.value;
        valueLabel.style.width = '32px';
        valueLabel.style.marginLeft = '10px';
        valueLabel.style.color = '#fff';
        row.appendChild(valueLabel);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerText = '✕';
        removeBtn.title = 'Remove parameter';
        removeBtn.style.marginLeft = '10px';
        removeBtn.style.background = '#444';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '4px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.addEventListener('click', () => {
            parameters.splice(idx, 1);
            sliderColors.splice(idx, 1);
            saveParameters();
            renderParameters();
        });
        row.appendChild(removeBtn);

        inner.appendChild(row);
    });

    // Add parameter and load buttons row
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '10px';
    btnRow.style.marginTop = '10px';
    btnRow.style.justifyContent = 'center';

    // + button
    const addBtn = document.createElement('button');
    addBtn.innerText = '+';
    addBtn.style.background = '#fff';
    addBtn.style.color = '#222';
    addBtn.style.fontWeight = 'bold';
    addBtn.style.border = 'none';
    addBtn.style.borderRadius = '4px';
    addBtn.style.padding = '8px 16px';
    addBtn.style.cursor = 'pointer';
    addBtn.addEventListener('click', () => {
        parameters.push({ name: 'NewParam', value: 0, min: 0, max: 100 });
        sliderColors.push(getRandomColor());
        saveParameters();
        renderParameters();
    });
    btnRow.appendChild(addBtn);

    // Load button
    const loadBtn = document.createElement('button');
    loadBtn.innerText = 'LOAD';
    loadBtn.style.background = '#fff';
    loadBtn.style.color = '#222';
    loadBtn.style.fontWeight = 'bold';
    loadBtn.style.border = 'none';
    loadBtn.style.borderRadius = '4px';
    loadBtn.style.padding = '8px 16px';
    loadBtn.style.cursor = 'pointer';
    loadBtn.addEventListener('click', loadParametersFromConfig);
    btnRow.appendChild(loadBtn);

    inner.appendChild(btnRow);

    container.appendChild(inner);
    addCustomSliderStyles();
}

function addCustomSliderStyles() {
    // Remove old style if exists
    const oldStyle = document.getElementById('custom-slider-style');
    if (oldStyle) oldStyle.remove();
    // Create new style
    let style = document.createElement('style');
    style.id = 'custom-slider-style';
    let css = `body { background: #111 !important; color: #fff; }
    .custom-slider { height: 8px; border-radius: 4px; background: #fff !important; outline: none; }
    .slider-container { color: #fff; }
    /* Track styles */
    .custom-slider::-webkit-slider-runnable-track { background: #fff !important; height: 8px; border-radius: 4px; }
    .custom-slider::-moz-range-track { background: #fff !important; height: 8px; border-radius: 4px; }
    .custom-slider::-ms-fill-lower, .custom-slider::-ms-fill-upper { background: #fff !important; height: 8px; border-radius: 4px; }
    /* Thumb base style */
    .custom-slider::-webkit-slider-thumb { width: 18px; height: 18px; border-radius: 0 !important; background: #fff !important; border: 2px solid #fff !important; cursor: pointer; -webkit-appearance: none; appearance: none; margin-top: -5px; }
    .custom-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 0 !important; background: #fff !important; border: 2px solid #fff !important; cursor: pointer; }
    .custom-slider::-ms-thumb { width: 18px; height: 18px; border-radius: 0 !important; background: #fff !important; border: 2px solid #fff !important; cursor: pointer; }
    .custom-slider:focus { outline: none; }
    .custom-slider::-ms-tooltip { display: none; }
    `;
    // Add per-slider color for thumb
    parameters.forEach((param, idx) => {
        const color = sliderColors[idx] || '#fff';
        css += `.custom-slider[data-idx="${idx}"]::-webkit-slider-thumb { background: ${color} !important; border-color: ${color} !important; }
`;
        css += `.custom-slider[data-idx="${idx}"]::-moz-range-thumb { background: ${color} !important; border-color: ${color} !important; }
`;
        css += `.custom-slider[data-idx="${idx}"]::-ms-thumb { background: ${color} !important; border-color: ${color} !important; }
`;
    });
    style.innerHTML = css;
    document.head.appendChild(style);
}

function loadParameters() {
    fetch('http://localhost:3000/parameters')
        .then(response => response.json())
        .then(data => {
            parameters = Array.isArray(data.parameters) ? data.parameters : [];
            sliderColors = parameters.map(() => getRandomColor());
            renderParameters();
        })
        .catch(error => console.error('Error loading parameters:', error));
}

function loadParametersFromConfig() {
    fetch('sliders_python/config.json')
        .then(response => response.json())
        .then(data => {
            // Convert config.json format to parameters format, scaling values by 10
            parameters = data.map(param => {
                let v = typeof param.value === 'number' ? param.value * 10 : 0;
                return {
                    name: param.name,
                    value: v,
                    min: typeof v === 'number' ? Math.round(v * 0.7) : 0,
                    max: typeof v === 'number' ? Math.round(v * 1.3) : 100
                };
            });
            sliderColors = parameters.map(() => getRandomColor());
            renderParameters();
            saveParameters();
        })
        .catch(error => console.error('Error loading config.json:', error));
}

function saveParameters() {
    fetch('http://localhost:3000/parameters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parameters })
    })
    .then(response => response.json())
    .then(data => console.log('Parameters updated:', data))
    .catch(error => console.error('Error updating parameters:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    loadParameters();
    const loadBtn = document.getElementById('load-params-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadParametersFromConfig);
    }
}); 