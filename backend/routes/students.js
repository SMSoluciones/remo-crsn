const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

// Cloudinary setup (optional) - requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    cloudinary = null;
    console.warn('Cloudinary env vars not set - image uploads will be skipped.');
  }
} catch (err) {
  cloudinary = null;
  console.warn('Cloudinary SDK not available. Install it with `npm i cloudinary` to enable uploads.');
}
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  sharp = null;
  console.warn('Sharp not available. Install it with `npm i sharp` to enable server-side image processing.');
}

router.get('/', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update student by identifier (dni or email)
router.put('/by-identifier', async (req, res) => {
  try {
    const { identifier, data } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier required' });
    const query = { $or: [{ dni: identifier }, { email: identifier }] };
    // If avatar is a data URL, optionally process it (sharp) then upload to Cloudinary
    if (data && data.avatar && typeof data.avatar === 'string' && data.avatar.startsWith('data:')) {
      // parse data URL
      const matches = data.avatar.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const b64 = matches[2];
        let buffer = Buffer.from(b64, 'base64');
        try {
          if (sharp) {
            // resize to max width 800 and convert to jpeg for smaller size
            const processed = await sharp(buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
            buffer = processed;
          }
        } catch (err) {
          console.warn('Image processing (sharp) failed, continuing with original buffer:', err);
        }

        if (cloudinary) {
          try {
            const folder = `students/${identifier}`;
            const public_id = `avatar_${identifier}`;
            const dataUri = 'data:image/jpeg;base64,' + buffer.toString('base64');
            const uploadRes = await cloudinary.uploader.upload(dataUri, {
              folder,
              public_id,
              overwrite: true,
              transformation: [{ width: 400, height: 400, crop: 'thumb', gravity: 'face' }]
            });
            data.avatar = uploadRes.secure_url;
          } catch (err) {
            console.warn('Cloudinary upload failed:', err);
            // fallback: keep base64 data (not ideal)
            data.avatar = 'data:image/jpeg;base64,' + buffer.toString('base64');
          }
        } else {
          console.warn('Cloudinary not configured - storing processed base64');
          data.avatar = 'data:image/jpeg;base64,' + buffer.toString('base64');
        }
      }
    }

    const student = await Student.findOneAndUpdate(query, data, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Authenticated endpoint for the current student (expects Authorization: Bearer <token>)
  router.put('/me', async (req, res) => {
    try {
      const auth = req.headers.authorization || '';
      if (!auth) return res.status(401).json({ error: 'No autorizado' });
      const parts = auth.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Formato de token inválido' });
      const token = parts[1];
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'remocrsn_secret';
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      const identifier = payload.documento || payload.email;
      if (!identifier) return res.status(401).json({ error: 'No se pudo identificar al usuario' });
      const data = req.body || {};
      // Reuse same avatar handling logic as above
      if (data && data.avatar && typeof data.avatar === 'string' && data.avatar.startsWith('data:')) {
        const matches = data.avatar.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          let buffer = Buffer.from(matches[2], 'base64');
          try {
            if (sharp) {
              const processed = await sharp(buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
              buffer = processed;
            }
          } catch (err) {
            console.warn('Sharp processing failed in /me route', err);
          }
          if (cloudinary) {
            try {
              const folder = `students/${identifier}`;
              const public_id = `avatar_${identifier}`;
              const dataUri = 'data:image/jpeg;base64,' + buffer.toString('base64');
              const uploadRes = await cloudinary.uploader.upload(dataUri, { folder, public_id, overwrite: true, transformation: [{ width: 400, height: 400, crop: 'thumb', gravity: 'face' }] });
              data.avatar = uploadRes.secure_url;
            } catch (err) {
              console.warn('Cloudinary upload failed in /me route', err);
              data.avatar = 'data:image/jpeg;base64,' + buffer.toString('base64');
            }
          } else {
            data.avatar = 'data:image/jpeg;base64,' + buffer.toString('base64');
          }
        }
      }
      const query = { $or: [{ dni: identifier }, { email: identifier }] };
      const student = await Student.findOneAndUpdate(query, data, { new: true });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      res.json(student);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estudiante eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
