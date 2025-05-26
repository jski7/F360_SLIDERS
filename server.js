const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

const PARAMS_PATH = path.join(__dirname, 'sliders_python', 'parameters.json');
const CONFIG_PATH = path.join(__dirname, 'sliders_python', 'config.json');

// Load parameters from file or use default
function loadParameters() {
    try {
        if (fs.existsSync(PARAMS_PATH)) {
            const data = JSON.parse(fs.readFileSync(PARAMS_PATH, 'utf8'));
            if (Array.isArray(data.parameters)) {
                console.log('Loaded parameters from file');
                return data;
            }
        }
    } catch (error) {
        console.error('Error loading parameters:', error.message);
    }
    
    // Default structure
    console.log('Using default parameters');
    return {
        parameters: [
            { name: 'Length', value: 50, min: 0, max: 100, unit: 'mm' },
            { name: 'Width', value: 50, min: 0, max: 100, unit: 'mm' },
            { name: 'Height', value: 50, min: 0, max: 100, unit: 'mm' },
            { name: 'Radius', value: 50, min: 0, max: 100, unit: 'mm' }
        ]
    };
}

let paramData = loadParameters();

// Watch for changes in parameters.json
const watcher = chokidar.watch(PARAMS_PATH, {
    persistent: true,
    ignoreInitial: true
});

watcher.on('change', (path) => {
    console.log(`Parameters file changed: ${path}`);
    try {
        const newData = JSON.parse(fs.readFileSync(path, 'utf8'));
        if (Array.isArray(newData.parameters)) {
            paramData = newData;
            console.log('Parameters updated from file');
        }
    } catch (error) {
        console.error('Error reading updated parameters:', error.message);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all parameters (full structure)
app.get('/parameters', (req, res) => {
    try {
        res.json(paramData);
    } catch (error) {
        console.error('Error sending parameters:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST to update all parameters (full structure)
app.post('/parameters', (req, res) => {
    try {
        if (Array.isArray(req.body.parameters)) {
            paramData = { parameters: req.body.parameters };
            fs.writeFileSync(PARAMS_PATH, JSON.stringify(paramData, null, 2));
            console.log('Parameters updated successfully');
            res.json({ success: true });
        } else {
            console.error('Invalid parameters format received');
            res.status(400).json({ success: false, error: 'Invalid format' });
        }
    } catch (error) {
        console.error('Error updating parameters:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    watcher.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Closing server...');
    watcher.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 