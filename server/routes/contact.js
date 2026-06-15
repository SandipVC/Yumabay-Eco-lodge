import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db, isFirebaseEnabled } from '../firebase.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const LEADS_FILE = join(__dir, '../data/leads.json');

const validators = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Phone too long'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be 5–2000 characters'),
  body('propertyInterest').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('language').optional().isIn(['en', 'es']),
];

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function visitorEmailHtml(name, lang) {
  const isEs = lang === 'es';
  return `
  <div style="font-family:'Jost',sans-serif;background:#0A1A22;color:#FDFAF5;padding:40px;max-width:600px;margin:0 auto;">
    <h1 style="font-family:Georgia,serif;color:#C9A84C;font-size:32px;font-weight:300;margin-bottom:8px;">YUMA BAY</h1>
    <p style="font-size:11px;letter-spacing:.3em;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:32px;">Eco Lodge &amp; Residences</p>
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:300;margin-bottom:16px;">
      ${isEs ? `Gracias, ${name}` : `Thank you, ${name}`}
    </h2>
    <p style="color:rgba(255,255,255,.65);line-height:1.9;margin-bottom:24px;">
      ${isEs
        ? 'Hemos recibido tu consulta sobre Yuma Bay Eco Lodge. Nuestro equipo se pondrá en contacto contigo en las próximas 24–48 horas para brindarte más información sobre nuestras propiedades de lujo en Boca de Yuma, República Dominicana.'
        : 'We have received your enquiry about Yuma Bay Eco Lodge. Our team will be in touch within 24–48 hours to provide you with more information about our luxury properties in Boca de Yuma, Dominican Republic.'}
    </p>
    <div style="border-top:1px solid rgba(201,168,76,.3);padding-top:24px;margin-top:24px;">
      <p style="font-size:12px;color:rgba(255,255,255,.35);">Calle Malecon · Boca de Yuma · La Romana · Dominican Republic</p>
      <p style="font-size:12px;color:rgba(255,255,255,.35);">info@yumabay.com · +1 (809) 000-0000</p>
    </div>
  </div>`;
}

function teamEmailHtml(lead) {
  return `
  <div style="font-family:Arial,sans-serif;padding:24px;max-width:600px;">
    <h2 style="color:#C9A84C;">New Lead — Yuma Bay</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;font-weight:bold;width:140px;">Name</td><td style="padding:8px;">${lead.name}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${lead.email}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${lead.phone || '—'}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Interest</td><td style="padding:8px;">${lead.propertyInterest || '—'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Language</td><td style="padding:8px;">${lead.language || 'en'}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Message</td><td style="padding:8px;">${lead.message}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Received</td><td style="padding:8px;">${new Date(lead.createdAt).toLocaleString()}</td></tr>
    </table>
  </div>`;
}

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, phone, message, propertyInterest, language } = req.body;

  const lead = {
    id: uuidv4(),
    name,
    email,
    phone: phone || '',
    message,
    propertyInterest: propertyInterest || '',
    language: language || 'en',
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  try {
    if (isFirebaseEnabled) {
      await db.collection('leads').doc(lead.id).set(lead);
    } else {
      let leads = [];
      if (existsSync(LEADS_FILE)) {
        leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
      }
      leads.unshift(lead);
      writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    }
  } catch (err) {
    console.error('Failed to save lead:', err.message);
    return res.status(500).json({ error: 'Failed to save your enquiry. Please try again.' });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = createTransport();
      const fromAddress = `"${process.env.FROM_NAME || 'Yuma Bay'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: language === 'es' ? 'Gracias por tu consulta — Yuma Bay' : 'Thank you for your enquiry — Yuma Bay',
        html: visitorEmailHtml(name, language),
      });

      if (process.env.TEAM_EMAIL) {
        await transporter.sendMail({
          from: fromAddress,
          to: process.env.TEAM_EMAIL,
          subject: `New Lead: ${name} — Yuma Bay Enquiry`,
          html: teamEmailHtml(lead),
        });
      }
    } catch (err) {
      console.error('Email send failed:', err.message);
    }
  }

  res.status(201).json({ success: true, message: 'Enquiry received. We will be in touch shortly.' });
});

export default router;
