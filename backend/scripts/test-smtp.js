#!/usr/bin/env node
// Simple SMTP test script using nodemailer
// Usage: node scripts/test-smtp.js recipient@example.com

const nodemailer = require('nodemailer');

async function main() {
  const to = process.argv[2] || process.env.TEST_SMTP_TO;
  if (!to) {
    console.error('Usage: node scripts/test-smtp.js recipient@example.com\nOr set TEST_SMTP_TO env var');
    process.exit(1);
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass) {
    console.error('Missing SMTP_* environment variables. Fill them in backend/.env or environment.');
    process.exit(2);
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Prueba SMTP - REMO CRSN',
      text: `Este es un correo de prueba desde REMO CRSN. Si lo recibes, la configuración SMTP funciona.\nHora: ${new Date().toISOString()}`,
    });
    console.log('Email enviado correctamente. Respuesta del servidor:', info);
    process.exit(0);
  } catch (err) {
    console.error('Error enviando email:', err);
    process.exit(3);
  }
}

main();
