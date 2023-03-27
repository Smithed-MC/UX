import Client from 'client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactDOMServer from 'react-dom/server'
import App from './App'
import './index.css'
import Main from './main'
import { StaticRouter } from 'react-router-dom/server'


export default function render(url: string) {
    let html = ReactDOMServer.renderToString(
        <StaticRouter location={ url } >
            <Main />
        </StaticRouter>
    );
}