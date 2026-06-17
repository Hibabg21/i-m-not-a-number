// نستورد React باش نشغلو app
import React from 'react'
import ReactDOM from 'react-dom/client'

// نستورد App الرئيسي
import App from './App.jsx'

// نستورد CSS ديال leaflet (مهم بزاف)
import 'leaflet/dist/leaflet.css'

// نشغلو React داخل root في index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)