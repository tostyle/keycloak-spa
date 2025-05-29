import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import './LoginPage.css'

function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => {
    setIsLoggingIn(true)
    window.location.href = '/auth/login'
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome to Keycloak SPA</h1>
        <p>Please log in to access your profile</p>
        
        <button 
          onClick={handleLogin} 
          disabled={isLoggingIn}
          className="login-button"
        >
          {isLoggingIn ? 'Logging in...' : 'Login with Keycloak'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage
