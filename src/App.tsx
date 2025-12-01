import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Connections from './projects/connections/Connections';

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
