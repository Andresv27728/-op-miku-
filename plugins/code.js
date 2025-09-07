import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const dataDir = process.env.DATA_DIR || '.'
const dbPath = join(dataDir, 'database.json')

async function readDB() {
  try {
    const data = await readFile(dbPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { tokens: [] }
  }
}

async function writeDB(data) {
  await writeFile(dbPath, JSON.stringify(data, null, 2))
}

export default {
  name: 'code',
  description: 'Generates a token for a new sub-bot (Owner only).',

  async run({ sock, m }) {
    const isGroup = m.messages[0].key.remoteJid.endsWith('@g.us')
    const sender = isGroup ? jidNormalizedUser(m.messages[0].key.participant) : jidNormalizedUser(m.messages[0].key.remoteJid)

    const isOwner = global.owner.some(owner => owner[0] === sender.split('@')[0])

    if (!isOwner) {
      await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'This command is for the bot owner only.' })
      return
    }

    const token = randomBytes(16).toString('hex')

    const db = await readDB()
    db.tokens.push({ token, createdAt: new Date().toISOString(), owner: sender })
    await writeDB(db)

    const response = `
*Sub-bot Token Generated!* 🤖

Here is your unique token:
\`\`\`${token}\`\`\`

To start your sub-bot, run the following command in your terminal:
\`\`\`node sub-bot.js --token=${token}\`\`\`

This will start a new bot instance linked to this token. You will need to use the 8-digit pairing code for the sub-bot's number.
    `
    // Send the token directly to the owner, not to the group
    await sock.sendMessage(sender, { text: response })

    // Optionally, notify in the original chat that the code was sent
    if (isGroup) {
        await sock.sendMessage(m.messages[0].key.remoteJid, { text: `The sub-bot token has been sent to the owner's private chat.` })
    }
  }
}
