const { spawn } = require('child_process')

const baseUrl = 'http://localhost:4000'
const email = `codex-${Date.now()}@souqna.test`
const password = 'Password123!'

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)
  return { response, body }
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const { response } = await request('/api/health')
      if (response.ok) return
    } catch {}
    await wait(500)
  }
  throw new Error('Server did not become ready')
}

async function main() {
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  server.stdout.on('data', chunk => process.stdout.write(chunk))
  server.stderr.on('data', chunk => process.stderr.write(chunk))

  try {
    await waitForServer()

    const registered = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Codex Test', email, password }),
    })
    if (registered.response.status !== 201 || !registered.body?.token || registered.body.user.passwordHash) {
      throw new Error(`register failed: ${registered.response.status} ${JSON.stringify(registered.body)}`)
    }

    const duplicate = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Codex Test', email, password }),
    })
    if (duplicate.response.status !== 409) {
      throw new Error(`duplicate register expected 409, got ${duplicate.response.status}`)
    }

    const wrongPassword = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'WrongPassword123!' }),
    })
    if (wrongPassword.response.status !== 401) {
      throw new Error(`wrong password expected 401, got ${wrongPassword.response.status}`)
    }

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (!login.response.ok || !login.body?.token || login.body.user.passwordHash) {
      throw new Error(`login failed: ${login.response.status} ${JSON.stringify(login.body)}`)
    }

    const me = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${login.body.token}` },
    })
    if (!me.response.ok || me.body?.user?.email !== email) {
      throw new Error(`me failed: ${me.response.status} ${JSON.stringify(me.body)}`)
    }

    const tampered = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.token.value' },
    })
    if (tampered.response.status !== 401) {
      throw new Error(`tampered token expected 401, got ${tampered.response.status}`)
    }

    console.log('auth flow verified')
  } finally {
    server.kill()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
