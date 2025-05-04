const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

const PARAMS_PATH = path.join(__dirname, 'sliders_python', 'parameters.json');

// Load parameters from file or use default
function loadParameters() {
    if (fs.existsSync(PARAMS_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(PARAMS_PATH, 'utf8'));
            if (Array.isArray(data.parameters)) return data;
        } catch (e) {}
    }
    // Default structure
    return {
        parameters: [
            { name: 'Length', value: 50, min: 0, max: 100 },
            { name: 'Width', value: 50, min: 0, max: 100 },
            { name: 'Height', value: 50, min: 0, max: 100 },
            { name: 'Radius', value: 50, min: 0, max: 100 }
        ]
    };
}

let paramData = loadParameters();

// GET all parameters (full structure)
app.get('/parameters', (req, res) => {
    res.json(paramData);
});

// POST to update all parameters (full structure)
app.post('/parameters', (req, res) => {
    if (Array.isArray(req.body.parameters)) {
        paramData = { parameters: req.body.parameters };
        fs.writeFileSync(PARAMS_PATH, JSON.stringify(paramData, null, 2));
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'Invalid format' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 