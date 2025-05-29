import './Header.css'
import { Link } from '@tanstack/react-router'

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <h1>Keycloak SPA</h1>
      </div>
      <nav className="nav">
        <div className="nav-links">
          <Link to="/login" activeProps={{ className: 'active' }}>
            Login
          </Link>
          <Link to="/profile" activeProps={{ className: 'active' }}>
            Profile
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header
