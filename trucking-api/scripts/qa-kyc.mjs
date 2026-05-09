const base = process.env.API_BASE_URL || 'http://localhost:3002'

const rand = Date.now()
const email = `qa_driver_${rand}@test.com`
const phone = `03${String(Math.floor(100000000 + Math.random() * 900000000)).slice(0, 9)}`
const password = 'TestPass1A'

const pngHex =
  '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000a49444154789c636000000200015d0ba2b40000000049454e44ae426082'

const createPngBlob = () =>
  new Blob([Buffer.from(pngHex, 'hex')], { type: 'image/png' })

async function main() {
  const signupRes = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      phone,
      password,
      first_name: 'QA',
      last_name: 'Driver',
      role: 'driver',
    }),
  })
  const signup = await signupRes.json()
  if (!signupRes.ok) {
    console.error('signup_failed', signup)
    process.exit(1)
  }

  const token = signup.data.tokens.access_token

  const uploadOne = async (documentType, documentKey) => {
    const fd = new FormData()
    fd.append('document', createPngBlob(), `x_${documentKey}.png`)
    fd.append('documentType', documentType)
    fd.append('documentKey', documentKey)
    const r = await fetch(`${base}/api/kyc/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const j = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, body: j }
  }

  const uploads = [
    await uploadOne('id_card', 'cnicFront'),
    await uploadOne('id_card', 'cnicBack'),
    await uploadOne('driving_license', 'license'),
  ]

  const docsRes = await fetch(`${base}/api/kyc/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const docs = await docsRes.json()

  console.log(
    JSON.stringify(
      {
        base,
        email,
        phone,
        uploads: uploads.map((u) => ({ ok: u.ok, status: u.status })),
        docsCount: (docs.data || []).length,
        docKeys: (docs.data || []).map((d) => d.document_key),
        hasPreview: (docs.data || []).some((d) => Boolean(d.preview_url)),
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

