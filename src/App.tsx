import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import DaftarAnggota from './pages/DaftarAnggota';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/daftar-anggota" element={<DaftarAnggota />} />
      </Routes>
    </Router>
  );
}

export default App;
