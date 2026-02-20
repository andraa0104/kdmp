import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, TrendingUp, DollarSign, ShoppingBag, Newspaper, FileText, Settings, UserCog, Activity, X, ChevronDown, ChevronRight, Palette, User, UserPlus, Shield, Key, MapPin } from 'lucide-react';
import { useState } from 'react';
import Logo from '../Logo';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, isCollapsed, onClose }: SidebarProps) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
    { icon: Users, label: 'Kelola Anggota', path: '/superadmin/anggota' },
    { icon: Wallet, label: 'Kelola Simpanan', path: '/superadmin/simpanan' },
    { icon: TrendingUp, label: 'Kelola Pinjaman', path: '/superadmin/pinjaman' },
    { icon: DollarSign, label: 'Kelola SHU', path: '/superadmin/shu' },
    { icon: Activity, label: 'Transaksi', path: '/superadmin/transaksi' },
    { icon: ShoppingBag, label: 'Kelola Toko', path: '/superadmin/toko' },
    { icon: Newspaper, label: 'Kelola Berita', path: '/superadmin/berita' },
    { icon: FileText, label: 'Laporan', path: '/superadmin/laporan' },
  ];

  const userManagementSubMenu = [
    { icon: UserPlus, label: 'Daftar User', path: '/superadmin/users/list' },
    { icon: Shield, label: 'Kelola Role', path: '/superadmin/users/roles' },
    { icon: Key, label: 'Kelola Permission', path: '/superadmin/users/permissions' },
  ];

  const settingsSubMenu = [
    { icon: Palette, label: 'Appearance', path: '/superadmin/settings/appearance' },
    { icon: User, label: 'Account', path: '/superadmin/settings/account' },
    { icon: MapPin, label: 'Dusun & RT', path: '/superadmin/settings/dusun-rt' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Logo size={40} />
            {!isCollapsed && (
              <div className="sidebar-brand">
                <span className="brand-name">Koperasi</span>
                <span className="brand-role">Superadmin</span>
              </div>
            )}
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
                title={item.label}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <div className="nav-item-group">
            <button
              className={`nav-item nav-item-parent ${location.pathname.includes('/superadmin/users') ? 'active' : ''}`}
              onClick={() => setUserManagementOpen(!userManagementOpen)}
              title="Manajemen User"
            >
              <UserCog size={20} />
              {!isCollapsed && (
                <>
                  <span>Manajemen User</span>
                  {userManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>

            {userManagementOpen && !isCollapsed && (
              <div className="sub-menu">
                {userManagementSubMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sub-menu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="nav-item-group">
            <button
              className={`nav-item nav-item-parent ${location.pathname.includes('/superadmin/settings') ? 'active' : ''}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Settings"
            >
              <Settings size={20} />
              {!isCollapsed && (
                <>
                  <span>Settings</span>
                  {settingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>

            {settingsOpen && !isCollapsed && (
              <div className="sub-menu">
                {settingsSubMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sub-menu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
