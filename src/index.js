import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import http from 'http';
import mongoose from 'mongoose';
import { handler } from './handler.js';

const privateKey = process.env.SSL_PRIVATE_KEY;
const certificate = process.env.SSL_CERTIFICATE;
const credentials = privateKey && certificate ? { key: privateKey, cert: certificate } : null;

const port = process.env.PORT || (credentials ? 8443 : 88);
const whitelistIds = (process.env.WHITELIST_IDS || '').split(',');
const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  throw new Error('BOT_TOKEN env')
}

if (!process.env.GROUP_ID || !process.env.CA_TOPIC_ID) {
  throw new Error('GROUP_ID, CA_TOPIC_ID envs')
}


const app = express();
app.use(bodyParser.json({ limit: '50kb' }));

app.use('/tg-signature-validator-bot-webhook', (req, res) => {
  const payload = req.body;
  console.log(req.method, JSON.stringify(payload))

  if (req.method === 'POST' && payload?.message && whitelistIds.includes(payload.message.from.id.toString())) {
    handler(payload.message, botToken);
  }

  res.end();
});

const server = credentials ? https.createServer(credentials, app) : http.createServer(app);

const start = async () => {
  await mongoose.connect(process.env.MONGO_URL);

  server.listen(port, () => {
    console.log(`Server started on port ${port} [HTTP${credentials ? 'S' : ''}]`);
  });
}

start();
