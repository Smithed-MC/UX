import Client from 'client'
import React from 'react'
import './index.css'

export default function Main() {
  return <React.StrictMode>
    <Client platform="website" />
  </React.StrictMode>
}