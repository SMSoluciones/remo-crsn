require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

const users = [
  {
    nombre: 'Sebastian',
    apellido: 'Muñoz',
    email: 'smunoz.id@gmail.com',
    rol: 'admin',
  },
  {
    nombre: 'Emilio',
    apellido: 'Desantis',
    email: 'emilio@example.com',
    rol: 'entrenador',
  },
  {
    nombre: 'Pamela',
    apellido: 'Borgetto',
    email: 'pborgetto@gmail.com',
    rol: 'mantenimiento',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');
    await User.deleteMany({});
    await User.insertMany(users);
    console.log('Usuarios insertados correctamente');
  } catch (err) {
    console.error('Error al insertar usuarios:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

seed();
