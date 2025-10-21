import React from 'react'

export function OpenInWarpcast() {
  const open = () => {
    const url = `${window.location.origin}/`
    window.location.href = `https://warpcast.com/~/add-mini-app?url=${encodeURIComponent(url)}`
  }
  return (
    <button onClick={open} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #444', background: '#1f2937', color: '#fff', cursor: 'pointer' }}>
      Open in Warpcast
    </button>
  )
}
