import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Home: React.FC = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <h1 className="main-title">Welcome</h1>
        
        <div className="config-card">
          <h2 className="config-title">Games & Tools</h2>
          
          <div className="connections-list">
            <Link to="/connections" className="game-card-link">
              <div className="game-card">
                <h3 className="game-card-title">🔗 Connections</h3>
                <p className="game-card-description">
                  Create and play custom Connections puzzles. Build your own word groups and challenge others!
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

