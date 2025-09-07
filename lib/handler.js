import { readdirSync } from 'fs'
import { join } from 'path'
import { Boom } from '@hapi/boom'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const __dirname = join(import.meta.url, '..')
const pluginsDir = join(__dirname, '../plugins')

export async function handler(sock, m) {
  if (!m.messages) return
  const message = m.messages[0]
  if (message.key.fromMe) return

  const isGroup = message.key.remoteJid.endsWith('@g.us')
  const sender = isGroup ? jidNormalizedUser(message.key.participant) : jidNormalizedUser(message.key.remoteJid)

  const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
  if (!text) return

  const command = text.toLowerCase().split(' ')[0] || ''
  if (!command) return

  const commandFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'))
  const commandFile = commandFiles.find(file => file.toLowerCase().startsWith(command))

  if (commandFile) {
    const commandPath = join(pluginsDir, commandFile)
    try {
      const { default: cmd } = await import(`file://${commandPath}?update=${Date.now()}`)
      if (typeof cmd.run === 'function') {
        await cmd.run({ sock, m, text, command })
      }
    } catch (e) {
      console.error(`Error executing command ${command}:`, e)
      const error = new Boom(e)
      if (error.output.statusCode === 404) {
        await sock.sendMessage(message.key.remoteJid, { text: `Command not found: ${command}` })
      } else {
        await sock.sendMessage(message.key.remoteJid, { text: `An error occurred while executing the command.` })
      }
    }
  }
}
