import { exec } from 'child_process'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

export default {
  name: 'update',
  description: 'Updates the bot from the git repository (Owner only).',

  async run({ sock, m }) {
    const isGroup = m.messages[0].key.remoteJid.endsWith('@g.us')
    const sender = isGroup ? jidNormalizedUser(m.messages[0].key.participant) : jidNormalizedUser(m.messages[0].key.remoteJid)

    const isOwner = global.owner.some(owner => owner[0] === sender.split('@')[0])

    if (!isOwner) {
      await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'This command is for the bot owner only.' })
      return
    }

    await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'Updating the bot... 🔄' })

    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        sock.sendMessage(sender, { text: `Update failed:\n\n${error}` })
        return
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        sock.sendMessage(sender, { text: `Update resulted in an error:\n\n${stderr}` })
        return
      }

      const response = `*Update successful!* ✅\n\nChanges:\n\`\`\`${stdout}\`\`\`\n\nRestarting bot to apply changes...`

      sock.sendMessage(sender, { text: response }).then(() => {
        // Use process.exit() and let the deployment environment (like Render) handle the restart.
        process.exit(0)
      })
    })
  }
}
