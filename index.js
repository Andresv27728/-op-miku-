import './config.js'
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import readline from 'readline'
import chalk from 'chalk'
import { handler } from './lib/handler.js'
import { join } from 'path'

const logger = pino({ level: 'silent' })

const app = express()
const server = http.createServer(app)
const io = new Server(server)

let messagesReceived = 0

// Serve static files from the root directory
app.use(express.static('.'))

io.on('connection', (socket) => {
  console.log(chalk.cyan('A user connected to the Miku dashboard! 🎶'))
  // Send initial stats on connection
  socket.emit('stats', { messagesReceived })

  socket.on('disconnect', () => {
    console.log(chalk.red('A user disconnected from the Miku dashboard.'))
  })
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const dataDir = process.env.DATA_DIR || '.'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(join(dataDir, 'auth_info_baileys'))

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    auth: state,
  })

  if (!sock.authState.creds.registered) {
    const phoneNumber = await question(chalk.bgBlack(chalk.greenBright('Please enter your WhatsApp number (e.g., 5219999999999): ')))
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(chalk.bgBlack(chalk.yellowBright(`Your pairing code is: ${code}`)))
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      io.emit('status', 'disconnected')
      const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
      console.log(chalk.red('Connection closed! 🔌'), lastDisconnect.error)
      if (shouldReconnect) {
        console.log(chalk.yellow('Reconnecting...'))
        connectToWhatsApp()
      }
    } else if (connection === 'open') {
      io.emit('status', 'connected')
      console.log(chalk.greenBright('Miku is online and ready to sing! 🎤'))
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async (m) => {
    messagesReceived++
    io.emit('stats', { messagesReceived })
    await handler(sock, m)
  })

  return sock
}

connectToWhatsApp()

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
