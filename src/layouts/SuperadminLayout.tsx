import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';
import './SuperadminLayout.css';

const SuperadminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="superadmin-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />
        
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperadminLayout;
