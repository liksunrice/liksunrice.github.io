import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { useReactiveBackground } from '../hooks/useReactiveBackground';

const Home: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [closingDropdown, setClosingDropdown] = useState<string | null>(null);
  const [openingDropdown, setOpeningDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { ref: homeDivRef, backgroundPosition, handleMouseMove } = useReactiveBackground({
    multiplier: 0.03,
  });

  const handleMouseEnter = (dropdown: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setClosingDropdown(null);
    setOpeningDropdown(dropdown);
    setOpenDropdown(dropdown);
    // Remove opening class after animation completes
    setTimeout(() => setOpeningDropdown(null), 400);
  };

  const handleMouseLeave = (dropdown: string) => {
    setClosingDropdown(dropdown);
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
      setClosingDropdown(null);
    }, 200); // Match CSS transition duration
  };

  return (
    <div 
      ref={homeDivRef}
      className="home-div"
      onMouseMove={handleMouseMove}
      style={{
        backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`
      }}
    >
        <h1 className="home-title">liksunrice</h1>
        <p className="home-title-footer">known person?</p>
        <nav className="home-navbar">
          <div 
            className="dropdown"
            onMouseEnter={() => handleMouseEnter('projects')}
            onMouseLeave={() => handleMouseLeave('projects')}
          >
            <button className="dropdown-toggle">
              Projects
              <span className={`dropdown-arrow ${openDropdown === 'projects' ? 'open' : ''}`}>▼</span>
            </button>
            {openDropdown === 'projects' && (
              <div className={`dropdown-menu ${openingDropdown === 'projects' ? 'opening' : ''} ${closingDropdown === 'projects' ? 'closing' : ''}`}>
                <Link to="/connections" className="dropdown-item">
                  Connections Builder
                </Link>
                <Link to="/memeMaker" className="dropdown-item">
                  Meme Maker
                </Link>
              </div>
            )}
          </div>
          <div 
            className="dropdown"
            onMouseEnter={() => handleMouseEnter('findme')}
            onMouseLeave={() => handleMouseLeave('findme')}
          >
            <button className="dropdown-toggle">
              Find me
              <span className={`dropdown-arrow ${openDropdown === 'findme' ? 'open' : ''}`}>▼</span>
            </button>
            {openDropdown === 'findme' && (
              <div className={`dropdown-menu ${openingDropdown === 'findme' ? 'opening' : ''} ${closingDropdown === 'findme' ? 'closing' : ''}`}>
                <Link to="https://github.com/LikSunRice" className="dropdown-item">
                  github
                </Link>
              </div>
            )}
          </div>
        </nav>
    </div>
  );
};

export default Home;

