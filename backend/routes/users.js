const express = require('express');
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar usuario: permite al admin o al propietario autenticado
// Actualizar usuario (restringido a admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
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
    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Request a password-change token (mailing disabled)
router.post('/request-password-change', async (req, res) => {
  try {
    const { identifier } = req.body;
    console.log('[request-password-change] received identifier:', identifier);
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });
    const ors = [{ documento: identifier }, { email: identifier }];
    if (mongoose.Types.ObjectId.isValid(String(identifier))) ors.push({ _id: identifier });
    const user = await User.findOne({ $or: ors });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const token = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    try {
      await User.findByIdAndUpdate(user._id, { resetToken: token, resetTokenExpires: expires }, { new: true, runValidators: false });
      console.log('[request-password-change] reset token saved for user id:', String(user._id));
    } catch (err) {
      console.error('Error saving reset token for user (findByIdAndUpdate):', err);
    }
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;
    return res.json({ message: 'Token generado (mailing deshabilitado)', token, resetUrl, dev: true });
  } catch (err) {
    console.error('Error in /request-password-change:', err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.status(500).json({ error: 'Error generando token' });
  }
});

// Confirm password change using token (kept for compatibility but mailing is disabled)
router.post('/confirm-password-change', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required' });
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error confirmando el cambio de contraseña' });
  }
});

// Change password by identifier (existing behavior kept)
router.post('/change-password', async (req, res) => {
  try {
    const { identifier, currentPassword, newPassword } = req.body;
    if (!identifier || !newPassword) return res.status(400).json({ error: 'identifier and newPassword are required' });
    const query = { $or: [{ documento: identifier }, { email: identifier }] };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error cambiando la contraseña' });
  }
});

// New: change password for the currently logged-in user (expects `x-user-email` or `x-user-id` header)
router.post('/me/change-password', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword is required' });
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: String(userEmail).toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'Usuario no autenticado' });
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando la contraseña' });
  }
});

// Update authenticated user's basic profile (email, telefono, direccion)
router.put('/me/update-profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const { email, telefono, direccion } = req.body;
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      user = await require('../models/User').findById(userId);
    } else if (userEmail) {
      user = await require('../models/User').findOne({ email: String(userEmail).toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'Usuario no autenticado' });
    const updates = {};
    if (email) updates.email = String(email).toLowerCase();
    if (telefono) updates.telefono = telefono;
    if (direccion) updates.direccion = direccion;
    // avatar not supported currently
    Object.assign(user, updates);
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error('Error in /me/update-profile:', err);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

module.exports = router;
