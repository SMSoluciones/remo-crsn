const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware simple de autorización por rol via header
function requireAdmin(req, res, next) {
  const role = String(req.headers['x-user-role'] || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a admin' });
  }
  next();
}

// Obtener todos los usuarios
router.get('/', requireAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Listar solo entrenadores (abierto para lectura)
router.get('/trainers', async (req, res) => {
  const trainers = await User.find({ rol: 'entrenador' }).select('-password');
  res.json(trainers);
});

// Crear usuario
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ error: 'Password es requerido' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ ...rest, password: hashedPassword });
    await user.save();
    // Do not return password hash in response
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar usuario
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar usuario
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  const { email, password, documento } = req.body;
  try {
    // Soportar login por documento o por email (compatibilidad)
    let user = null;
    if (documento) {
      user = await User.findOne({ documento: String(documento).trim() });
    } else if (email) {
      user = await User.findOne({ email: String(email).trim().toLowerCase() });
    } else {
      return res.status(400).json({ error: 'Email o documento requerido' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    // No enviar la contraseña en la respuesta
    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
