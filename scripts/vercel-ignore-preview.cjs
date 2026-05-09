const vercelEnv = process.env.VERCEL_ENV || 'unknown'
const commitRef = process.env.VERCEL_GIT_COMMIT_REF || 'unknown'

if (vercelEnv === 'production') {
  console.log(`[vercel-ignore-preview] build enabled for production from ${commitRef}`)
  process.exit(1)
}

console.log(`[vercel-ignore-preview] skipping ${vercelEnv} build from ${commitRef}`)
process.exit(0)
