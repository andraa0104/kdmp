import { useState } from 'react';
import { Save } from 'lucide-react';
import './PermissionManagement.css';

const PermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState('ketua');

  const roles = [
    { value: 'ketua', label: 'Ketua Koperasi' },
    { value: 'wakil_anggota', label: 'Wakil Bidang Anggota' },
    { value: 'wakil_usaha', label: 'Wakil Bidang Usaha' },
    { value: 'sekretaris', label: 'Sekretaris' },
    { value: 'bendahara', label: 'Bendahara' },
    { value: 'admin_anggota', label: 'Admin Anggota' },
    { value: 'admin_konten', label: 'Admin Konten' },
    { value: 'admin_keuangan', label: 'Admin Keuangan' },
  ];

  const menus = [
    { id: 1, name: 'Dashboard', view: true, create: false, edit: false, delete: false },
    { id: 2, name: 'Kelola Anggota', view: true, create: false, edit: false, delete: false },
    { id: 3, name: 'Kelola Simpanan', view: true, create: false, edit: false, delete: false },
    { id: 4, name: 'Kelola Pinjaman', view: true, create: true, edit: true, delete: false },
    { id: 5, name: 'Kelola SHU', view: true, create: false, edit: false, delete: false },
    { id: 6, name: 'Transaksi', view: true, create: false, edit: false, delete: false },
    { id: 7, name: 'Kelola Toko', view: false, create: false, edit: false, delete: false },
    { id: 8, name: 'Kelola Berita', view: true, create: false, edit: false, delete: false },
    { id: 9, name: 'Laporan', view: true, create: false, edit: false, delete: false },
  ];

  return (
    <div className="permission-page">
      <div className="page-header">
        <div>
          <h1>Kelola Permission</h1>
          <p>Manage menu access for each role</p>
        </div>
        <button className="btn-save">
          <Save size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="permission-card">
        <div className="role-selector">
          <label>Select Role / Jabatan:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-select"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="permission-table-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>View</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id}>
                  <td className="menu-name">{menu.name}</td>
                  <td>
                    <label className="checkbox-wrapper">
                      <input type="checkbox" defaultChecked={menu.view} />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td>
                    <label className="checkbox-wrapper">
                      <input type="checkbox" defaultChecked={menu.create} />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td>
                    <label className="checkbox-wrapper">
                      <input type="checkbox" defaultChecked={menu.edit} />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td>
                    <label className="checkbox-wrapper">
                      <input type="checkbox" defaultChecked={menu.delete} />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
