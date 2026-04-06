const fs = require('fs')
const path = require('path')

const serverDir = path.join(process.cwd(), '.next', 'server')
const manifestPath = path.join(serverDir, 'middleware-manifest.json')
const manifest = {
  version: 3,
  middleware: {},
  functions: {},
  sortedMiddleware: [],
}

fs.mkdirSync(serverDir, { recursive: true })

if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}
