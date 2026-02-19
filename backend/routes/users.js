const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'remocrsn_secret';

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth) return res.status(401).json({ error: 'No autorizado' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Formato de token inválido' });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains id, email, documento, rol
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

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

// Actualizar usuario: permite al admin o al propietario autenticado
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Solo admin o el propio usuario puede actualizar
    const requesterRole = (req.user && req.user.rol) || '';
    const requesterId = (req.user && req.user.id) || '';
    if (String(requesterRole).toLowerCase() !== 'admin' && String(requesterId) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Acceso restringido' });
    }

    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
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
      const token = jwt.sign({ id: user._id, email: user.email, documento: user.documento, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, ...userData });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Cambiar contraseña (verifica contraseña actual)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error cambiando la contraseña' });
  }
});

module.exports = router;
