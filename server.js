const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');
const http = require('http');

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Simple route for testing
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'Blockchain License Guardian API is running' });
});

// Copyright information endpoint
app.get('/api/copyright', (req, res) => {
  // Return copyright information
  res.json({
    copyright: "© 2025 Ervin Remus Radosavlevici",
    email: "ervin210@sky.com, ervin210@icloud.com",
    rights: "All rights reserved. This software is protected by copyright law.",
    notice: "Unauthorized copying, modification, distribution, or use of this software is strictly prohibited."
  });
});

// Create HTTP server
const httpServer = http.createServer(app);

// Set up WebSocket server for real-time notifications
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    
    // Echo the message back for testing
    if (ws.readyState === 1) { // WebSocket.OPEN is 1
      ws.send(`Echo: ${message}`);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to quantum blockchain DRM system'
  }));
});

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at http://localhost:${PORT}`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});