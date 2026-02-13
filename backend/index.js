require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();
// Add request logging and robust CORS to aid debugging from browser
const morgan = require('morgan');
app.use(morgan('dev'));

// Allow custom headers x-user-id and x-user-role for our header-based auth
const corsOptions = {
  origin: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  // Allow the custom user headers the frontend sends
  allowedHeaders: ['Content-Type', 'x-user-id', 'x-user-role', 'x-user-email', 'x-user-name', 'x-user-fullname', 'x-user'],
  exposedHeaders: ['x-user-id', 'x-user-role', 'x-user-email', 'x-user-name', 'x-user-fullname', 'x-user'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
const path = require('path');
// Servir archivos subidos (fotos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;


mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch((err) => console.error('Error de conexión:', err));


// Rutas CRUD
app.use('/api/users', require('./routes/users'));
app.use('/api/boats', require('./routes/boats'));
app.use('/api/students', require('./routes/students'));
app.use('/api/boat-reports', require('./routes/boatReports'));
app.use('/api/technical-sheets', require('./routes/technicalSheets'));
app.use('/api/events', require('./routes/events'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/boat-usages', require('./routes/boatUsages'));

app.get('/', (req, res) => {
  res.send('API REMO-CRSN funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
