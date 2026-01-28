import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import http from 'http';
import mongoose from 'mongoose';
import { handler } from './handler.js';
import { getMe } from './api/info.js';
import { CommandError } from './helpers.js';

const privateKey = process.env.SSL_PRIVATE_KEY;
const certificate = process.env.SSL_CERTIFICATE;
const credentials = privateKey && certificate ? { key: privateKey, cert: certificate } : null;

const port = process.env.PORT || (credentials ? 8443 : 88);
const whitelistIds = (process.env.WHITELIST_IDS || '').split(',');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN env')
}

if (!process.env.SECRET_TOKEN) {
  throw new Error('SECRET_TOKEN env')
}

if (!process.env.CA_CHAT_ID || !process.env.PUBLISH_CHAT_ID) {
  throw new Error('CA_CHAT_ID (CA_TOPIC_ID), PUBLISH_CHAT_ID (PUBLISH_TOPIC_ID) envs')
}

let botInfo;

const app = express();
app.use(bodyParser.json({ limit: '50kb' }));

app.use('/tg-signature-validator-bot-webhook', (req, res) => {
  const payload = req.body;
  console.log(req.method, JSON.stringify(payload))
  const isQueryValid = req.headers['x-telegram-bot-api-secret-token'] === process.env.SECRET_TOKEN;

  if (isQueryValid && req.method === 'POST' && payload?.message && whitelistIds.includes(payload.message.from.id.toString())) {
    try {
      handler(payload.message, botInfo);
    } catch(e) {
      if (!(e instanceof CommandError)) {
        console.error(e);
      }
    }
  }

  res.end();
});

const server = credentials ? https.createServer(credentials, app) : http.createServer(app);

const start = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  botInfo = (await getMe()).result;

  server.listen(port, () => {
    console.log(`Server started on port ${port} [HTTP${credentials ? 'S' : ''}]`);
  });
}

start();
