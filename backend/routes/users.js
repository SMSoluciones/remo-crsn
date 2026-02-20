const express = require('express');
const User = require('../models/User');
const mongoose = require('mongoose');
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
    console.log('[request-password-change] received identifier:', identifier);
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });
    // Build a safe $or query; only include _id clause if identifier is a valid ObjectId to avoid CastError
    const ors = [{ documento: identifier }, { email: identifier }];
    if (mongoose.Types.ObjectId.isValid(String(identifier))) {
      ors.push({ _id: identifier });
    }
    const user = await User.findOne({ $or: ors });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    // generate token and persist it using an update (avoids full document validation errors)
    const token = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    try {
      await User.findByIdAndUpdate(user._id, { resetToken: token, resetTokenExpires: expires }, { new: true, runValidators: false });
      console.log('[request-password-change] reset token saved for user id:', String(user._id));
    } catch (err) {
      console.error('Error saving reset token for user (findByIdAndUpdate):', err);
      // Do not abort the flow — fallthrough to return token in response for dev/testing
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;

    // try to send email if SMTP configured and user has an email
    if (!user.email) {
      console.warn('[request-password-change] User does not have an email address; returning token in response (dev fallback)');
      return res.json({ message: 'Token generado (dev fallback — usuario sin email)', token, resetUrl, dev: true });
    }

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

        // helper: send mail with a timeout to avoid hanging if SMTP is blocked/unresponsive
        const sendMailWithTimeout = (transporter, mailOpts, timeoutMs = 15000) => {
          return Promise.race([
            transporter.sendMail(mailOpts),
            new Promise((_, reject) => setTimeout(() => reject(new Error('sendMail timeout')), timeoutMs))
          ]);
        };
        const fromAddress = process.env.SMTP_FROM || 'no-reply@remocrsn.local';
        const userDisplayName = (user.nombre && user.apellido) ? `${user.nombre} ${user.apellido}` : (user.email || 'usuario');
        const expireMinutes = 60;
        // small helper to safely escape user-provided strings in HTML
        function escapeHtml(str) {
          if (!str) return '';
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }
        const htmlBody = `\n          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#111;">\n            <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #e6e6e6;border-radius:8px;background:#ffffff;">\n              <h2 style="color:#0b6b3b;margin-top:0">Recuperación de contraseña — REMO CRSN</h2>\n              <p>Hola ${escapeHtml(userDisplayName)},</p>\n              <p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta. Haz clic en el botón de abajo para continuar. Este enlace expirará en ${expireMinutes} minutos.</p>\n              <p style="text-align:center;margin:24px 0;">\n                <a href="${resetUrl}" style="background:#0b6b3b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">Cambiar mi contraseña</a>\n              </p>\n              <p style="font-size:14px;color:#555">Si el botón no funciona, copia y pega la siguiente URL en tu navegador:</p>\n              <p style="word-break:break-all;color:#0b6b3b">${resetUrl}</p>\n              <hr style="border:none;border-top:1px solid #eee;margin:18px 0" />\n              <p style="font-size:14px;color:#333"><strong>Token de verificación (opcional):</strong></p>\n              <pre style="background:#f6f8fa;padding:10px;border-radius:6px;border:1px solid #eaecef;color:#111">${token}</pre>\n              <p style="font-size:12px;color:#666;margin-top:12px">Si no solicitaste este cambio de contraseña, puedes ignorar este correo. Si crees que tu cuenta está comprometida, contacta con soporte.</p>\n              <p style="font-size:12px;color:#999;margin-top:18px">REMO CRSN — Servicio de gestión deportiva</p>\n            </div>\n          </div>\n        `;
        console.log('[request-password-change] sending email to', user.email, 'using host', process.env.SMTP_HOST);
        try {
          await sendMailWithTimeout(transporter, {
            from: `${process.env.APP_NAME || 'REMO CRSN'} <${fromAddress}>`,
            to: user.email,
            subject: 'REMO CRSN — Recuperación de contraseña',
            text: `Hola ${userDisplayName},\\n\\nPara cambiar tu contraseña, visita: ${resetUrl}\\n\\nSi no solicitaste esto, ignora este mensaje.\\n\\nToken: ${token}\\n\\nEste enlace expirará en ${expireMinutes} minutos.`,
            html: htmlBody,
          }, 15000);
          console.log('[request-password-change] email sent to', user.email);
          return res.json({ message: 'Email de verificación enviado' });
        } catch (err) {
          console.warn('Error sending email (or timeout):', err);
          // fallthrough to return token in response as fallback
        }
      } catch (err) {
        console.warn('Error creating transporter or sending email:', err);
        // fallthrough to return token in response as fallback (not ideal for production)
      }
    }

    // Fallback: return token in response (useful for local/dev)
      res.json({ message: 'Token generado (dev fallback)', token, resetUrl, dev: true });
  } catch (err) {
    console.error('Error in /request-password-change:', err);
    // In development return the real error message to help debugging
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.status(500).json({ error: 'Error generando token' });
  }
});

// Dev-only: return a token directly for testing (disabled in production)
router.post('/dev-request-password-change', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' });
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });
    const ors = [{ documento: identifier }, { email: identifier }];
    if (mongoose.Types.ObjectId.isValid(String(identifier))) ors.push({ _id: identifier });
    const user = await User.findOne({ $or: ors });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const token = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    try {
      await User.findByIdAndUpdate(user._id, { resetToken: token, resetTokenExpires: expires }, { new: true, runValidators: false });
    } catch (err) {
      console.error('Error saving reset token in dev endpoint:', err);
    }
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;
    return res.json({ message: 'Dev token generado', token, resetUrl });
  } catch (err) {
    console.error('Error in /dev-request-password-change:', err);
    return res.status(500).json({ error: err.message || 'Error generando token (dev)' });
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
