require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
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

app.get('/', (req, res) => {
  res.send('API REMO-CRSN funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
