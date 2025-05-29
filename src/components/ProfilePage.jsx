import Profile from './Profile'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import './ProfilePage.css'

function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if the user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/profile', {
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // If not authenticated, redirect to login
          navigate({ to: '/login' })
        }
      } catch (error) {
        console.error('Error checking authentication status:', error)
        navigate({ to: '/login' })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleLogout = () => {
    window.location.href = '/auth/logout'
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="profile-page">
      <div className="profile-header-actions">
        <h1>Your Profile</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <Profile user={user} />
    </div>
  )
}

export default ProfilePage
