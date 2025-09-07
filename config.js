import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  ['51999999999', 'CREATOR', true],
]
global.botName = 'Hatsune Miku Bot'
global.packname = 'Hatsune Miku'
global.author = 'Bot'

// Other settings
global.prems = ['51999999999']
global.APIs = {
  // API Prefix
  // name: 'https://website'
  nrtm: 'https://nurutomo.herokuapp.com',
  zenz: 'https://zenzapis.xyz',
},
global.APIKeys = {
  // APIKey Here
  // 'https://website': 'apikey'
  'https://zenzapis.xyz': 'YOUR_API_KEY',
}

// Sticker WM
global.wm = 'Hatsune Miku Bot'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
