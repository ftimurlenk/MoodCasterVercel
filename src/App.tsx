import React, { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { WalletConnect } from './components/WalletConnect'
import { AddMiniApp } from './components/AddMiniApp'
import { OpenInWarpcast } from './components/OpenInWarpcast'

export default function App() {
  const [text, setText] = useState('')
  const [isMiniApp, setIsMiniApp] = useState<boolean>(false)

  useEffect(() => {
    document.title = 'MoodCaster';
    (async () => {
      try {
        await sdk.actions.ready()
      } catch (e) {
        console.error('ready() failed', e)
      }
      try {
        const inMini = await (sdk as any).isInMiniApp?.()
        setIsMiniApp(!!inMini)
      } catch (e) {
        setIsMiniApp(false)
      }
    })()
  }, [])

  async function hapticSuccess() {
    try {
      const caps = await (sdk as any).getCapabilities?.()
      if (Array.isArray(caps) && caps.includes('haptics.notificationOccurred')) {
        await (sdk as any).haptics?.notificationOccurred?.('success')
      }
    } catch {}
  }

  async function postCast() {
    const msg = text.trim()
    if (!msg) return alert('Write something first.')

    try {
      if (sdk.actions.requestPermissions) {
        const granted = await sdk.actions.requestPermissions(['cast'])
        if (!granted?.includes?.('cast')) throw new Error('Cast permission not granted')
      }

      if (sdk.actions.composeCast) {
        const result = await sdk.actions.composeCast({ text: msg })
        if (result === null) {
          console.log('Cast composer cancelled by user')
          return
        }
        await hapticSuccess()
        alert('Cast sent (composer).')
        return
      }

      await (sdk as any).actions?.cast?.(msg)
      await hapticSuccess()
      alert('Cast posted!')
    } catch (e) {
      console.error('cast flow failed:', e)
      try {
        await (sdk as any).actions?.openCastComposer?.({ text: msg })
      } catch (e2) {
        console.error('openCastComposer failed', e2)
        if (!isMiniApp) {
          alert('Please open inside Warpcast to post.')
        } else {
          alert('Could not post. Please try again.')
        }
      }
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560, margin: '24px auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ margin: 0 }}>MoodCaster 🌙</h1>
      <p style={{ opacity: .8, margin: 0 }}>Describe your mood and post to Farcaster.</p>

      {!isMiniApp && (
        <div style={{ padding: 12, borderRadius: 12, border: '1px solid #333', background: '#111', color: '#eee' }}>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
            You are not inside a Farcaster Mini App container. Some features (cast, wallet) require Warpcast.
          </p>
          <div style={{ marginTop: 8 }}>
            <OpenInWarpcast />
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder="Feeling focused and grateful today..."
        style={{ padding: 12, borderRadius: 12, border: '1px solid #333', background: '#111', color: '#eee' }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={postCast} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #444', background: '#6e56cf', color: '#fff', cursor: 'pointer' }}>Post</button>
        <AddMiniApp />
      </div>

      <div style={{ height: 1, background: '#222', margin: '8px 0' }} />

      <WalletConnect />
    </div>
  )
}
