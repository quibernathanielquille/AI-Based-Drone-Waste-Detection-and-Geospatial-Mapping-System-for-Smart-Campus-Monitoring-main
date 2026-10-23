import { NavLink, useNavigate } from 'react-router-dom';
import DroneIcon from './DroneIcon';
import { markIntroComplete } from '../utils/intro';

export default function PublicNav() {
  const navigate = useNavigate();

  const goLogin = () => {
    markIntroComplete();
    navigate('/login');
  };

  return (
    <header className="public-nav">
      <NavLink to="/" className="public-nav-brand" end>
        <DroneIcon size={36} variant="white" />
        <span>Campus Eye</span>
      </NavLink>

      <nav className="public-nav-links" aria-label="Main">
        <NavLink to="/" className="public-nav-link" end>
          Home
        </NavLink>
        <NavLink to="/about" className="public-nav-link">
          About Us
        </NavLink>
        <NavLink to="/about#contact" className="public-nav-link">
          Contact Us
        </NavLink>
        <button type="button" className="btn public-nav-cta" onClick={goLogin}>
          Get Started
          <i className="bi bi-arrow-right ms-2" />
        </button>
      </nav>
    </header>
  );
}
