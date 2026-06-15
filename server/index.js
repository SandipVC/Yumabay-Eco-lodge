import 'dotenv/config';
import os from 'os';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import contactRouter from './routes/contact.js';
import leadsRouter   from './routes/leads.js';
import cmsRouter     from './routes/cms.js';
import { onRequest } from 'firebase-functions/v2/https';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  // Allow images/video served from same origin in the client
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Allow requests from localhost AND any device on the local network.
// In production set CLIENT_ORIGIN to the exact domain; in dev we accept
// any origin so phones/tablets on the same Wi-Fi can reach the API.
const ALLOWED_ORIGINS = process.env.CLIENT_ORIGIN
  ? [process.env.CLIENT_ORIGIN]
  : true; // true = reflect any Origin header (dev only)

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// CMS translation payloads (~25 KB) and sitemap zone arrays exceed 10 KB,
// so raise the JSON body limit. Mutating routes are still protected by
// ADMIN_SECRET in routes/cms.js + routes/leads.js.
app.use(express.json({ limit: '1mb' }));

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/contact', formLimiter, contactRouter);
app.use('/api/leads',   leadsRouter);
app.use('/api/cms',     cmsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.FIREBASE_CONFIG && !process.env.FUNCTIONS_EMULATOR) {
  app.listen(PORT, '0.0.0.0', () => {
    const lan = Object.values(os.networkInterfaces())
      .flat()
      .find(a => a.family === 'IPv4' && !a.internal);
    console.log(`\nYuma Bay API listening`);
    console.log(`  Local:   http://localhost:${PORT}`);
    if (lan) console.log(`  Network: http://${lan.address}:${PORT}`);
  });
}

export const api = onRequest({
  cors: true,
  maxInstances: 10,
  secrets: ['ADMIN_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'FROM_NAME', 'TEAM_EMAIL'],
}, app);
