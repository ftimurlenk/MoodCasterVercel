import React from'react'
export function OpenInWarpcast(){const open=()=>{const url=`${window.location.origin}/`;window.location.href=`https://warpcast.com/~/add-mini-app?url=${encodeURIComponent(url)}`};return(<button className='btn' onClick={open}>Open in Warpcast</button>)}
