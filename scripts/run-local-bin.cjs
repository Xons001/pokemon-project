const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const [, , packageName, ...binArgs] = process.argv

if (!packageName) {
  console.error('Usage: node scripts/run-local-bin.cjs <package-name> [...args]')
  process.exit(1)
}

function resolvePackageBin(targetPackageName) {
  const packageJsonPath = require.resolve(`${targetPackageName}/package.json`, {
    paths: [process.cwd()],
  })
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const packageDir = path.dirname(packageJsonPath)
  const packageShortName = targetPackageName.includes('/')
    ? targetPackageName.slice(targetPackageName.lastIndexOf('/') + 1)
    : targetPackageName

  if (!packageJson.bin) {
    throw new Error(`Package "${targetPackageName}" does not expose a bin entry.`)
  }

  const relativeBinPath =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin[targetPackageName] ??
        packageJson.bin[packageShortName] ??
        Object.values(packageJson.bin)[0]

  if (!relativeBinPath) {
    throw new Error(`Unable to resolve a bin file for package "${targetPackageName}".`)
  }

  return path.resolve(packageDir, relativeBinPath)
}

try {
  const binPath = resolvePackageBin(packageName)
  const result = spawnSync(process.execPath, [binPath, ...binArgs], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number') {
    process.exit(result.status)
  }

  process.exit(1)
} catch (error) {
  console.error(
    error instanceof Error ? error.message : `Unable to run local bin for package "${packageName}".`
  )
  process.exit(1)
}
