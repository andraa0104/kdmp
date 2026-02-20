import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import DaftarAnggota from './pages/DaftarAnggota';
import SuperadminLayout from './layouts/SuperadminLayout';
import SuperadminDashboard from './pages/admin/SuperadminDashboard';
import Appearance from './pages/admin/Appearance';
import Account from './pages/admin/Account';
import UserList from './pages/admin/UserList';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';
import DusunRT from './pages/admin/DusunRT';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/daftar-anggota" element={<DaftarAnggota />} />
        
        <Route path="/superadmin/*" element={<SuperadminLayout />}>
          <Route index element={<SuperadminDashboard />} />
          <Route path="settings/appearance" element={<Appearance />} />
          <Route path="settings/account" element={<Account />} />
          <Route path="settings/dusun-rt" element={<DusunRT />} />
          <Route path="users/list" element={<UserList />} />
          <Route path="users/roles" element={<RoleManagement />} />
          <Route path="users/permissions" element={<PermissionManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
