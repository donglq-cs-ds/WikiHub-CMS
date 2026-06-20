import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lobby from './components/lobby/Lobby';
import WorldLayout from './components/world/WorldLayout';
import 'tippy.js/dist/tippy.css';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/world/:worldId" element={<WorldLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;