/**
 * MBG Bread AI Workforce - Backend Server
 * Express server with REST API for lead management and automation
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

import leadsRoutes from './routes/leads.js';
import agentsRoutes from './routes/agents.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/automation', agentsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MBG Bread AI Workforce API Running',
        endpoints: {
            health: '/api/health',
            documentation: 'See frontend'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        name: 'MBG Bread AI Workforce',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('========================================');
    console.log('   MBG Bread AI Workforce - Backend');
    console.log('========================================');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /api/leads          - List leads');
    console.log('  GET  /api/leads/stats    - Dashboard KPIs');
    console.log('  GET  /api/leads/:id      - Lead detail');
    console.log('  PUT  /api/leads/:id      - Update lead');
    console.log('  POST /api/automation/run - Run full automation');
    console.log('  GET  /api/automation/status - System status');
    console.log('========================================');
});

export default app;
