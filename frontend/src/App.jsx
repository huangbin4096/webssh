import '@xterm/xterm/css/xterm.css';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TermPage from './pages/TermPage';
import NoTermPage from './pages/NoTermPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/term/:id" element={<TermPage />} />
        <Route path="/NoTermPage" element={<NoTermPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
