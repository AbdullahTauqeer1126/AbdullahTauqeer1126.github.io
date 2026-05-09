const base = process.env.API_BASE_URL || 'http://localhost:3105'

const mkCreds = (prefix) => {
  const ts = Date.now()
  return {
    email: `${prefix}_${ts}@test.com`,
    phone: `03${String(Math.floor(100000000 + Math.random() * 900000000)).slice(0, 9)}`,
    password: 'TestPass1A',
    first_name: 'QA',
    last_name: prefix,
  }
}

const signup = async (role, creds) => {
  const res = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, role }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`${role}_signup_failed: ${JSON.stringify(data)}`)
  return data.data
}

const api = async (token, method, path, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  const customer = await signup('customer', mkCreds('customer'))
  const driver = await signup('driver', mkCreds('driver'))
  const fleet = await signup('fleet_owner', mkCreds('fleet'))

  const fleetToken = fleet.tokens.access_token
  const customerToken = customer.tokens.access_token
  const driverToken = driver.tokens.access_token

  const truckRes = await api(fleetToken, 'POST', '/api/trucks', {
    plate_number: `QA-${Date.now()}`.slice(0, 14),
    make: 'Hino',
    model: '500',
    capacity: 18,
    truck_type: 'container',
    year: 2022,
    condition: 'good',
    insurance_expiry: new Date(Date.now() + 86400000 * 180).toISOString(),
    inspection_expiry: new Date(Date.now() + 86400000 * 120).toISOString(),
  })
  if (!truckRes.ok) throw new Error(`truck_create_failed: ${JSON.stringify(truckRes.data)}`)

  const shipmentRes = await api(customerToken, 'POST', '/api/shipments', {
    origin: 'Karachi',
    destination: 'Lahore',
    pickup_date: new Date(Date.now() + 86400000).toISOString(),
    delivery_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    cargo_description: 'Textile rolls',
    cargo_weight: 12,
    cargo_type: 'textile',
    special_requirements: 'Handle with care',
    budget: 150000,
  })
  if (!shipmentRes.ok) throw new Error(`shipment_create_failed: ${JSON.stringify(shipmentRes.data)}`)

  const bidRes = await api(fleetToken, 'POST', '/api/bids', {
    shipment_id: shipmentRes.data.data.id,
    truck_id: truckRes.data.data.id,
    driver_id: driver.user.id,
    bid_amount: 140000,
    estimated_time: 18,
    message: 'Ready to move',
  })
  if (!bidRes.ok) throw new Error(`bid_create_failed: ${JSON.stringify(bidRes.data)}`)

  const acceptRes = await api(customerToken, 'POST', `/api/bids/${bidRes.data.data.id}/accept`, {})
  if (!acceptRes.ok) throw new Error(`bid_accept_failed: ${JSON.stringify(acceptRes.data)}`)

  const tripByShipmentRes = await api(
    customerToken,
    'GET',
    `/api/trips/by-shipment?shipmentId=${encodeURIComponent(shipmentRes.data.data.id)}`
  )
  if (!tripByShipmentRes.ok) throw new Error(`trip_lookup_failed: ${JSON.stringify(tripByShipmentRes.data)}`)
  const tripId = tripByShipmentRes.data.data.id

  const startRes = await api(driverToken, 'POST', `/api/trips/${tripId}/start`, {})
  if (!startRes.ok) throw new Error(`trip_start_failed: ${JSON.stringify(startRes.data)}`)

  const locRes = await api(driverToken, 'POST', `/api/trips/${tripId}/location`, {
    latitude: 24.9011,
    longitude: 67.1201,
    speed_kmh: 62,
    heading: 110,
    accuracy_m: 8,
    current_location: 'Karachi Super Highway',
    distance_km: 19,
    recorded_at: new Date().toISOString(),
  })
  if (!locRes.ok) throw new Error(`location_update_failed: ${JSON.stringify(locRes.data)}`)

  const trackingRes = await api(customerToken, 'GET', `/api/trips/${tripId}/tracking`)
  const historyRes = await api(customerToken, 'GET', `/api/trips/${tripId}/history`)

  console.log(
    JSON.stringify(
      {
        tripId,
        trackingOk: trackingRes.ok,
        historyOk: historyRes.ok,
        trackingPoint: trackingRes.data?.data
          ? {
              lat: trackingRes.data.data.latitude,
              lng: trackingRes.data.data.longitude,
              status: trackingRes.data.data.status,
              stale: trackingRes.data.data.stale,
            }
          : null,
        historyCount: historyRes.data?.data?.locations?.length || 0,
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})

