import { useState } from 'react';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import './Account.css';

const Account = () => {
  const [formData, setFormData] = useState({
    fullName: 'Super Admin',
    username: 'superadmin',
    newPassword: ''
  });

  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Update data:', formData);
    // TODO: Implement update logic
  };

  return (
    <div className="account-page">
      <div className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your account information and security</p>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h2>Profile Information</h2>
            <p className="section-description">Update your personal information</p>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <User size={20} />
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <User size={20} />
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Change Password</h2>
            <p className="section-description">Update your password to keep your account secure</p>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <Lock size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              <Save size={20} />
              <span>Update Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Account;
