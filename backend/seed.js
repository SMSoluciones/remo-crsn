require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

async function getUsers() {
  const hashedAdmin = await bcrypt.hash('admin', 10);
  return [
    {
      nombre: 'Admin',
      apellido: 'Admin',
      email: 'admin@admin.com',
      rol: 'admin',
      password: hashedAdmin,
    },
    {
      nombre: 'Sebastian',
      apellido: 'Muñoz',
      email: 'smunoz.id@gmail.com',
      rol: 'admin',
      password: await bcrypt.hash('123456', 10),
    },
    {
      nombre: 'Emilio',
      apellido: 'Desantis',
      email: 'emilio@example.com',
      rol: 'entrenador',
      password: await bcrypt.hash('123456', 10),
    },
    {
      nombre: 'Pamela',
      apellido: 'Borgetto',
      email: 'pborgetto@gmail.com',
      rol: 'mantenimiento',
      password: await bcrypt.hash('123456', 10),
    },
  ];
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');
    await User.deleteMany({});
    const users = await getUsers();
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
