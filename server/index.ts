const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');
const { registerRoutes } = require('./routes');

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

// Register routes and get the HTTP server
async function startServer() {
  try {
    const httpServer = await registerRoutes(app);
    
    // Start the server
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(console.error);