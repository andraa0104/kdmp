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
import KelolaAnggota from './pages/admin/KelolaAnggota';
import PortalAnggotaLayout from './layouts/PortalAnggotaLayout';
import DashboardAnggota from './pages/anggota/DashboardAnggota';
import EditProfilAnggota from './pages/anggota/EditProfilAnggota';
import ProfilAnggota from './pages/anggota/ProfilAnggota';
import RiwayatAnggota from './pages/anggota/RiwayatAnggota';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/daftar-anggota" element={<DaftarAnggota />} />
        
        {/* Portal Anggota Routes */}
        <Route path="/portal-anggota/*" element={<PortalAnggotaLayout />}>
          <Route index element={<DashboardAnggota />} />
          <Route path="profil" element={<ProfilAnggota />} />
          <Route path="riwayat" element={<RiwayatAnggota />} />
          <Route path="edit-profil" element={<EditProfilAnggota />} />
        </Route>
        
        {/* Admin/Superadmin Routes */}
        <Route path="/superadmin/*" element={<SuperadminLayout />}>
          <Route index element={<SuperadminDashboard />} />
          <Route path="anggota" element={<KelolaAnggota />} />
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
