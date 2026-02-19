import { Menu, Bell, Search, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

const Header = ({ onMenuClick, onToggleCollapse, isCollapsed }: HeaderProps) => {
  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="collapse-toggle" onClick={onToggleCollapse}>
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        
        <div className="search-bar">
          <Search size={20} />
          <input type="text" placeholder="Cari anggota, transaksi..." />
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="header-divider"></div>

        <div className="header-profile">
          <div className="profile-avatar">SA</div>
          <div className="profile-info">
            <span className="profile-name">Super Admin</span>
            <span className="profile-role">Administrator</span>
          </div>
        </div>

        <button className="header-icon-btn logout-btn">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
