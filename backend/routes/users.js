const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  nodemailer = null;
  console.warn('nodemailer not available. Install with `npm i nodemailer` to enable email sending.');
}
const router = express.Router();

// JWT authentication removed; reverting to previous non-JWT behavior

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

// Request a password-change token via email
router.post('/request-password-change', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });
    const query = { $or: [{ documento: identifier }, { email: identifier }, { _id: identifier }] };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    // generate token
    const token = crypto.randomBytes(24).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;

    // try to send email
    if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false') === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@remocrsn.local',
          to: user.email,
          subject: 'Cambio de contraseña - REMO CRSN',
          text: `Para cambiar tu contraseña, visita: ${resetUrl}\nSi no solicitaste esto, ignora este mensaje.`,
          html: `<p>Para cambiar tu contraseña, haz click <a href="${resetUrl}">aquí</a>.</p><p>Si no solicitaste esto, ignora este mensaje.</p>`,
        });
        return res.json({ message: 'Email de verificación enviado' });
      } catch (err) {
        console.warn('Error sending email:', err);
        // fallthrough to return token in response as fallback (not ideal for production)
      }
    }

    // Fallback: return token in response (useful for local/dev)
    res.json({ message: 'Token generado (dev fallback)', token, resetUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error generando token' });
  }
});

// Confirm password change using token
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
// Cambiar contraseña (usa identifier). Si no se provee currentPassword, se permite actualizar directamente.
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
    } else {
      // WARNING: No current password provided — allowing direct password reset for identifier.
      // This is less secure; ensure this behavior is acceptable for your deployment.
    }
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error cambiando la contraseña' });
  }
});

module.exports = router;
