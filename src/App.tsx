import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Connections from './projects/connections/Connections';
<<<<<<< Updated upstream
=======
import MemeMaker from './projects/memeMaker/MemeMaker.tsx';
>>>>>>> Stashed changes

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connections" element={<Connections />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
