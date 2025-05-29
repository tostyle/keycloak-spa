import { Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Header from './components/Header'
import './App.css'

function App() {

  return (
    <div className="app-container">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
