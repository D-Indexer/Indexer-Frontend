import { Link, NavLink } from 'react-router-dom'
import { LoginButton } from '@/features/auth/components/LoginButton'
import { appRoutes } from '@/config/routes'
import { navigationItems } from '@/constants/navigation'
import { classNames } from '@/utils/classNames'

export const Header = () => {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to={appRoutes.home} className="brand">
          <span className="brand__mark">F</span>
          <span>Folder</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => classNames('nav__link', isActive && 'nav__link--active')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <LoginButton />
      </div>
    </header>
  )
}
