import { useState } from 'react';
import { UserPlus, Search, Edit, Trash2, Power, X, Eye, EyeOff } from 'lucide-react';
import './UserList.css';

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: '',
    jabatan: '',
    status: 'active'
  });

  const users = [
    { id: 1, name: 'Super Admin', username: 'superadmin', role: 'Superadmin', jabatan: '-', status: 'active' },
    { id: 2, name: 'Admin Anggota', username: 'admin_anggota', role: 'Admin', jabatan: 'Admin Anggota', status: 'active' },
    { id: 3, name: 'Ketua Koperasi', username: 'ketua', role: 'Pengurus', jabatan: 'Ketua', status: 'active' },
    { id: 4, name: 'Bendahara', username: 'bendahara', role: 'Pengurus', jabatan: 'Bendahara', status: 'active' },
    { id: 5, name: 'Budi Santoso', username: 'budi123', role: 'Anggota', jabatan: '-', status: 'active' },
    { id: 6, name: 'Admin Konten', username: 'admin_konten', role: 'Admin', jabatan: 'Admin Konten', status: 'inactive' },
  ];

  const adminJabatan = ['Admin Anggota', 'Admin Konten', 'Admin Keuangan'];
  const pengurusJabatan = ['Ketua', 'Wakil Bidang Anggota', 'Wakil Bidang Usaha', 'Sekretaris', 'Bendahara'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New user:', formData);
    // TODO: Add user logic
    setModalOpen(false);
    setFormData({ name: '', username: '', password: '', role: '', jabatan: '', status: 'active' });
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === '' || user.role.toLowerCase() === filterRole.toLowerCase();
    const matchStatus = filterStatus === '' || user.status === filterStatus;
    
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="user-list-page">
      <div className="page-header">
        <div>
          <h1>Daftar User</h1>
          <p>Manage all users in the system</p>
        </div>
        <button className="btn-add-user" onClick={() => setModalOpen(true)}>
          <UserPlus size={20} />
          <span>Tambah User</span>
        </button>
      </div>

      <div className="user-list-card">
        <div className="card-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select 
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="pengurus">Pengurus</option>
              <option value="anggota">Anggota</option>
            </select>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Jabatan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">{user.name.charAt(0)}</div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`badge badge-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.jabatan}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon" title="Toggle Status">
                        <Power size={18} />
                      </button>
                      <button className="btn-icon danger" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setModalOpen(false)}></div>
          <div className="modal-add-user">
            <div className="modal-header">
              <h3>Tambah User Baru</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Masukkan username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Masukkan password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value, jabatan: '' })}
                      required
                    >
                      <option value="">Pilih Role</option>
                      <option value="Admin">Admin</option>
                      <option value="Pengurus">Pengurus</option>
                      <option value="Anggota">Anggota</option>
                    </select>
                  </div>

                  {(formData.role === 'Admin' || formData.role === 'Pengurus') && (
                    <div className="form-group">
                      <label>{formData.role === 'Admin' ? 'Spesialisasi' : 'Jabatan'} *</label>
                      <select
                        value={formData.jabatan}
                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                        required
                      >
                        <option value="">Pilih {formData.role === 'Admin' ? 'Spesialisasi' : 'Jabatan'}</option>
                        {(formData.role === 'Admin' ? adminJabatan : pengurusJabatan).map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      />
                      <span>Active</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-submit">
                  <UserPlus size={20} />
                  <span>Tambah User</span>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default UserList;
