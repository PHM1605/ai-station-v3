import { createRoot } from 'react-dom/client'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import {AuthProvider} from "./context/AuthProvider.jsx"
import {StationProvider} from "./context/StationProvider.jsx"

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <StationProvider>
        <App />
      </StationProvider>
    </AuthProvider>
  </BrowserRouter>
)
