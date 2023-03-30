import Client from 'client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactDOMServer from 'react-dom/server'
import App from './App'
import './index.css'
import Main from './main'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Main/>
)