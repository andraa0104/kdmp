import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  HelpCircle,
  ChevronRight,
  History
} from 'lucide-react';
import { authService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import './PortalAnggotaLayout.css';

interface UserData {
  id: number;
  username: string;
  nama_lengkap: string;
  status?: string;
  nomor_anggota_koperasi?: string;
  no_registrasi?: string;
}

const PortalAnggotaLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { actualTheme: theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize userData from session
  const session = authService.getCurrentUser();
  const [userData] = useState<UserData | null>(() => {
    if (!session || session.userType !== 'anggota') {
      return null;
    }
    return session.user;
  });

  useEffect(() => {
    if (!session || session.userType !== 'anggota') {
      navigate('/login');
    }
  }, [navigate, session]);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/portal-anggota', name: 'Dashboard', icon: Home },
    { path: '/portal-anggota/profil', name: 'Profil Saya', icon: User },
    { path: '/portal-anggota/riwayat', name: 'Riwayat', icon: History },
    { path: '/portal-anggota/bantuan', name: 'Bantuan', icon: HelpCircle },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  if (!userData) {
    return <div className="loading-portal">Memuat...</div>;
  }

  return (
    <div className={`portal-anggota ${theme}`}>
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-left">
          <button 
            className="btn-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="portal-logo">
            <Logo size={40} />
            <div className="portal-logo-text">
              <h1>Portal Anggota</h1>
              <p>Koperasi Merah Putih</p>
            </div>
          </div>
        </div>

        <div className="portal-header-right">
          <button 
            className="btn-theme-toggle"
            onClick={handleThemeToggle}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="portal-user-info">
            <div className="user-avatar">
              {userData.nama_lengkap?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{userData.nama_lengkap}</span>
              <span className="user-status">{userData.status || 'Anggota'}</span>
            </div>
          </div>

          <button 
            className="btn-logout"
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="portal-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                <ChevronRight size={16} className="nav-arrow" />
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar-footer">
          <div className="member-info">
            {userData.nomor_anggota_koperasi ? (
              <>
                <p className="member-label">No. Anggota</p>
                <p className="member-number">{userData.nomor_anggota_koperasi}</p>
              </>
            ) : (
              <>
                <p className="member-label">No. Registrasi</p>
                <p className="member-number">{userData.no_registrasi}</p>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalAnggotaLayout;
