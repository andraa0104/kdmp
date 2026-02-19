import { useState } from 'react';
import { Shield, Users, UserCog, User, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import './RoleManagement.css';

interface Jabatan {
  id: number;
  name: string;
  description?: string;
  isSystem?: boolean;
  userCount?: number;
}

const RoleManagement = () => {
  const [adminJabatan, setAdminJabatan] = useState<Jabatan[]>([
    { id: 1, name: 'Admin Anggota', description: 'Mengelola data keanggotaan', userCount: 1 },
    { id: 2, name: 'Admin Konten', description: 'Mengelola konten website', userCount: 1 },
    { id: 3, name: 'Admin Keuangan', description: 'Mengelola transaksi keuangan', userCount: 1 },
  ]);

  const [pengurusJabatan, setPengurusJabatan] = useState<Jabatan[]>([
    { id: 1, name: 'Ketua', description: 'Ketua koperasi', userCount: 1 },
    { id: 2, name: 'Wakil Bidang Anggota', userCount: 1 },
    { id: 3, name: 'Wakil Bidang Usaha', userCount: 1 },
    { id: 4, name: 'Sekretaris', userCount: 1 },
    { id: 5, name: 'Bendahara', userCount: 1 },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'pengurus'>('admin');
  const [selectedJabatan, setSelectedJabatan] = useState<Jabatan | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const openAddModal = (role: 'admin' | 'pengurus') => {
    setModalType('add');
    setSelectedRole(role);
    setFormData({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (role: 'admin' | 'pengurus', jabatan: Jabatan) => {
    setModalType('edit');
    setSelectedRole(role);
    setSelectedJabatan(jabatan);
    setFormData({ name: jabatan.name, description: jabatan.description || '' });
    setModalOpen(true);
  };

  const openDeleteModal = (role: 'admin' | 'pengurus', jabatan: Jabatan) => {
    setModalType('delete');
    setSelectedRole(role);
    setSelectedJabatan(jabatan);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (modalType === 'add') {
      const newJabatan = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        userCount: 0
      };
      if (selectedRole === 'admin') {
        setAdminJabatan([...adminJabatan, newJabatan]);
      } else {
        setPengurusJabatan([...pengurusJabatan, newJabatan]);
      }
    } else if (modalType === 'edit' && selectedJabatan) {
      if (selectedRole === 'admin') {
        setAdminJabatan(adminJabatan.map(j => 
          j.id === selectedJabatan.id ? { ...j, name: formData.name, description: formData.description } : j
        ));
      } else {
        setPengurusJabatan(pengurusJabatan.map(j => 
          j.id === selectedJabatan.id ? { ...j, name: formData.name, description: formData.description } : j
        ));
      }
    } else if (modalType === 'delete' && selectedJabatan) {
      if (selectedRole === 'admin') {
        setAdminJabatan(adminJabatan.filter(j => j.id !== selectedJabatan.id));
      } else {
        setPengurusJabatan(pengurusJabatan.filter(j => j.id !== selectedJabatan.id));
      }
    }
    setModalOpen(false);
  };

  const roles = [
    {
      id: 1,
      name: 'Superadmin',
      icon: Shield,
      color: 'red',
      userCount: 1,
      description: 'Full access to all features and settings',
      isSystem: true,
      jabatan: []
    },
    {
      id: 2,
      name: 'Admin',
      icon: UserCog,
      color: 'blue',
      userCount: adminJabatan.reduce((sum, j) => sum + (j.userCount || 0), 0),
      description: 'Manage daily operations',
      isSystem: false,
      jabatan: adminJabatan
    },
    {
      id: 3,
      name: 'Pengurus',
      icon: Users,
      color: 'green',
      userCount: pengurusJabatan.reduce((sum, j) => sum + (j.userCount || 0), 0),
      description: 'Cooperative board members',
      isSystem: false,
      jabatan: pengurusJabatan
    },
    {
      id: 4,
      name: 'Anggota',
      icon: User,
      color: 'yellow',
      userCount: 450,
      description: 'Cooperative members',
      isSystem: true,
      jabatan: []
    }
  ];

  return (
    <div className="role-management-page">
      <div className="page-header">
        <h1>Kelola Role</h1>
        <p>Manage roles and positions in the system</p>
      </div>

      <div className="roles-grid">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.id} className={`role-card ${role.color}`}>
              <div className="role-header">
                <div className="role-icon">
                  <Icon size={32} />
                </div>
                <div className="role-count">{role.userCount} users</div>
              </div>
              <h3>{role.name}</h3>
              <p>{role.description}</p>
              
              {role.isSystem && (
                <div className="system-badge">
                  <AlertTriangle size={16} />
                  <span>Cannot be modified (System Role)</span>
                </div>
              )}
              
              {role.jabatan.length > 0 && (
                <div className="jabatan-list">
                  <div className="jabatan-header">
                    <h4>{role.name === 'Admin' ? 'Spesialisasi:' : 'Jabatan:'}</h4>
                    <button 
                      className="btn-add-jabatan"
                      onClick={() => openAddModal(role.name === 'Admin' ? 'admin' : 'pengurus')}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  <div className="jabatan-items">
                    {role.jabatan.map((j) => (
                      <div key={j.id} className="jabatan-item">
                        <div className="jabatan-info">
                          <span className="jabatan-name">{j.name}</span>
                          {j.description && <span className="jabatan-desc">{j.description}</span>}
                        </div>
                        <div className="jabatan-actions">
                          <button 
                            className="btn-icon-small"
                            onClick={() => openEditModal(role.name === 'Admin' ? 'admin' : 'pengurus', j)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-icon-small danger"
                            onClick={() => openDeleteModal(role.name === 'Admin' ? 'admin' : 'pengurus', j)}
                            disabled={j.isSystem}
                            title={j.isSystem ? 'Cannot delete system jabatan' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setModalOpen(false)}></div>
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'add' && 'Tambah Jabatan Baru'}
                {modalType === 'edit' && 'Edit Jabatan'}
                {modalType === 'delete' && 'Hapus Jabatan'}
              </h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalType === 'delete' ? (
                <>
                  <div className="delete-warning">
                    <AlertTriangle size={48} />
                    <p>Yakin hapus jabatan <strong>"{selectedJabatan?.name}"</strong>?</p>
                  </div>
                  {selectedJabatan?.userCount && selectedJabatan.userCount > 0 && (
                    <div className="warning-box">
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Warning:</strong>
                        <ul>
                          <li>{selectedJabatan.userCount} user menggunakan jabatan ini akan kehilangan akses</li>
                          <li>Permission akan terhapus</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Role:</label>
                    <input 
                      type="text" 
                      value={selectedRole === 'admin' ? 'Admin' : 'Pengurus'} 
                      disabled 
                      className="input-disabled"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Jabatan: *</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama jabatan"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi (opsional):</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Masukkan deskripsi jabatan"
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Batal
              </button>
              <button 
                className={`btn-primary ${modalType === 'delete' ? 'danger' : ''}`}
                onClick={handleSubmit}
                disabled={modalType !== 'delete' && !formData.name}
              >
                {modalType === 'add' && 'Simpan'}
                {modalType === 'edit' && 'Update'}
                {modalType === 'delete' && 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleManagement;
