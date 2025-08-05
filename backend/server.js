const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./api/auth/auth.routes');
const gameRoutes = require('./api/game/game.routes');
const userRoutes = require('./api/users/user.routes');
const socketHandler = require('./socket/socket.handler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connexion à la base de données
connectDB();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use('/api/', limiter);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/users', userRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion des WebSockets
socketHandler(io);

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur AX Chess démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

module.exports = { app, server, io };