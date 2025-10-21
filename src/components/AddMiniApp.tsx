import React,{useState}from'react'
import{sdk}from'@farcaster/miniapp-sdk'
export function AddMiniApp(){const[busy,setBusy]=useState(false);async function add(){try{setBusy(true);if(sdk.actions.addMiniApp){await sdk.actions.addMiniApp()}else{alert('addMiniApp() is not supported in this host.')}}catch(e){console.error('addMiniApp failed',e);alert('Could not add Mini App. Make sure you are on the production domain.')}finally{setBusy(false)}}return(<button className='btn' onClick={add} disabled={busy}>{busy?'Adding…':'Add to Farcaster'}</button>)}
