import Client from 'client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

export default function Main() {
  return <React.StrictMode>
    <Client platform="website" />
  </React.StrictMode>
}