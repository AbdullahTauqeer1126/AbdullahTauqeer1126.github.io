const base = process.env.API_BASE_URL || 'http://localhost:3105'

const mkCreds = (prefix) => ({
  email: `${prefix}_${Date.now()}@test.com`,
  phone: `03${String(Math.floor(100000000 + Math.random() * 900000000)).slice(0, 9)}`,
  password: 'TestPass1A',
  first_name: 'QA',
  last_name: prefix,
})

const signup = async (role, creds) => {
  const res = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, role }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data.data
}

async function main() {
  const fleet = await signup('fleet_owner', mkCreds('fleet_visible'))
  const customer = await signup('customer', mkCreds('customer_visible'))

  const createRes = await fetch(`${base}/api/trucks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${fleet.tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plate_number: `QA${String(Date.now()).slice(-8)}`,
      make: 'Hino',
      model: '500',
      capacity: 12,
      truck_type: 'container',
      year: 2022,
      condition: 'good',
      insurance_expiry: new Date(Date.now() + 86400000 * 30).toISOString(),
      inspection_expiry: new Date(Date.now() + 86400000 * 45).toISOString(),
    }),
  })
  const created = await createRes.json()
  if (!createRes.ok) throw new Error(`truck_create_failed: ${JSON.stringify(created)}`)

  const listRes = await fetch(`${base}/api/trucks`, {
    headers: { Authorization: `Bearer ${customer.tokens.access_token}` },
  })
  const listed = await listRes.json()
  if (!listRes.ok) throw new Error(`truck_list_failed: ${JSON.stringify(listed)}`)

  const visible = (listed.data || []).some((truck) => truck.id === created.data.id)
  console.log(
    JSON.stringify(
      {
        customerTruckCount: (listed.data || []).length,
        createdTruckId: created.data.id,
        visibleToCustomer: visible,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

