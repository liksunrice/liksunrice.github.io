import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Connections from './projects/connections/Connections';
import MemeMaker from './projects/memeMaker/memeMaker';
import MangaOCR from './projects/mangaOCR/MangaOCR';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/memeMaker" element={<MemeMaker />} />
        <Route path="/mangaOCR" element={<MangaOCR />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
