const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));
app.get('/admin', (req, res) => res.redirect('/api/admin'));

// Global error handler — logs the real error and returns it in the response
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Serve Vue frontend in production
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => console.log(`🏋️  GymTracker running on port ${PORT}`));
