// import './Profile.css'

function Profile({ user }) {
  if (!user) {
    return (
      <div className="profile-container not-authenticated">
        <h2>Not Authenticated</h2>
        <p>Please log in to view your profile information.</p>
      </div>
    )
  }

  // Filter out object values and sensitive info for display
  const userInfo = Object.entries(user).filter(([key, value]) => {
    return typeof value !== 'object' && 
           !['_raw', '_json', 'id', 'provider'].includes(key)
  })

  return (
    <div className="profile-container">
      <h2>User Profile</h2>

      <div className="profile-card">
        <div className="profile-header">
          {user.photos && user.photos[0] && (
            <img 
              className="profile-avatar" 
              src={user.photos[0].value} 
              alt="Profile"
            />
          )}
          <h3>{user.displayName || user.username || 'User'}</h3>
        </div>
        
        <div className="profile-details">
          {userInfo.map(([key, value]) => (
            <div className="profile-item" key={key}>
              <span className="profile-label">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
              </span>
              <span className="profile-value">{value.toString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Profile
