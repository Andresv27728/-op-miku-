import './config.js'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readFileSync } from 'fs'
import { join } from 'path'
import { handler } from './lib/handler.js'
import readline from 'readline'
import chalk from 'chalk'

const logger = pino({ level: 'silent' })
const dataDir = process.env.DATA_DIR || '.'
const dbPath = join(dataDir, 'database.json')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

function readDB() {
  try {
    const data = readFileSync(dbPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { tokens: [] }
  }
}

async function connectSubBot(token) {
  const db = readDB()
  const tokenData = db.tokens.find(t => t.token === token)

  if (!tokenData) {
    console.error(chalk.red('Invalid or expired token.'))
    process.exit(1)
  }

  console.log(chalk.yellow(`Starting sub-bot for token: ${token.slice(0, 8)}...`))

  const authDir = join(dataDir, `auth_info_sub_bot_${token}`)
  const { state, saveCreds } = await useMultiFileAuthState(authDir)

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Sub-Bot'),
    auth: state,
  })

  if (!sock.authState.creds.registered) {
    const phoneNumber = await question(chalk.bgBlack(chalk.greenBright('Please enter the sub-bot\'s WhatsApp number: ')))
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(chalk.bgBlack(chalk.yellowBright(`Your sub-bot pairing code is: ${code}`)))
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
      console.log(chalk.red(`Sub-bot ${token.slice(0,8)} connection closed.`), lastDisconnect.error)
      if (shouldReconnect) {
        console.log(chalk.yellow('Reconnecting...'))
        connectSubBot(token)
      }
    } else if (connection === 'open') {
      console.log(chalk.greenBright(`Sub-bot ${token.slice(0,8)} is now online!`))
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async (m) => {
    await handler(sock, m)
  })

  return sock
}

const tokenArg = process.argv.find(arg => arg.startsWith('--token='))
if (tokenArg) {
  const token = tokenArg.split('=')[1]
  connectSubBot(token)
} else {
  console.log(chalk.red('Error: Please provide a token using --token=<your-token>'))
  process.exit(1)
}
