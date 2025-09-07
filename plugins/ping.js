export default {
  name: 'ping',
  description: 'Checks the bot\'s responsiveness.',

  async run({ sock, m }) {
    const startTime = Date.now()
    await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'Measuring my vocal latency...' })
    const endTime = Date.now()
    const latency = endTime - startTime
    await sock.sendMessage(m.messages[0].key.remoteJid, { text: `🎤 Pong! My response time is ${latency}ms.` })
  }
}
