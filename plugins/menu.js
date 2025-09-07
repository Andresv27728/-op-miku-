import { readdirSync } from 'fs'
import { join } from 'path'

const __dirname = join(import.meta.url, '..')
const pluginsDir = join(__dirname, '../plugins')

export default {
  name: 'menu',
  description: 'Displays the list of available commands.',

  async run({ sock, m }) {
    const commandFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'))

    let menuText = `┌───୨୧・*Hatsune Miku*・୨୧───┐\n`
    menuText += `│ *Hi! I'm Miku, your virtual assistant!* 🎤\n`
    menuText += `│ Here are the things I can do:\n`
    menuText += `├─────────────────────୨୧\n`

    commandFiles.forEach(file => {
      const commandName = file.replace('.js', '')
      menuText += `│ 🎶 - ${commandName}\n`
    })

    menuText += `└─────────୨୧・*${global.botName}*・୨୧`

    await sock.sendMessage(m.messages[0].key.remoteJid, { text: menuText })
  }
}
