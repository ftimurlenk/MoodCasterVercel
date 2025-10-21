import React, { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function AddMiniApp() {
  const [busy, setBusy] = useState(false)
  async function add() {
    try {
      setBusy(true)
      if (sdk.actions.addMiniApp) {
        await sdk.actions.addMiniApp()
      } else {
        alert('addMiniApp() is not supported in this host.')
      }
    } catch (e) {
      console.error('addMiniApp failed', e)
      alert('Could not add Mini App. Make sure you are on the production domain.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button onClick={add} disabled={busy} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #444', background: '#374151', color: '#fff', cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
      {busy ? 'Adding…' : 'Add to Farcaster'}
    </button>
  )
}
