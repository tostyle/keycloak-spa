import Profile from './Profile'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './ProfilePage.css'

function ProfilePage() {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
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

  useEffect(() => {
    axios.get("/permissions").then((response) => {
        console.log("Permissions:", response.data)
        setPermissions(response.data)
        })
  }, [])

  const handleLogout = () => {
    window.location.href = '/auth/logout'
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  const createMarketing = () => {
    axios.post('/marketing', {
      // Add your marketing creation logic here
    })
    .then(response => {
      console.log('Marketing created:', response.data)
      // Optionally, redirect or show a success message
    })
  }

  const listMarketing = () => {
    axios.get('/marketing', {
      // Add your marketing creation logic here
    })
    .then(response => {
      console.log('Marketing getted:', response.data)
      // Optionally, redirect or show a success message
    })
  }

  return (
    <div className="profile-page">
      <div className="profile-header-actions">
        <h1>Your Profile</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <Profile user={user} />
      <hr/>
      <h2>Permissions</h2>
      {permissions.map(permission => {
        return (
          <div key={permission} className="permission-item">
            <div>{permission}</div>
          </div>
        )
      })}
      <hr/>
      <h2>Actions</h2>
      <div>
        <button onClick={listMarketing}>List Marketing</button>
        <button onClick={createMarketing}>Create Marketing</button>
      </div>
    </div>
  )
}

export default ProfilePage
