import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './Login.css';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', formData);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-section">
          <Link to="/" className="back-to-home">
            ← Kembali ke Beranda
          </Link>

          <div className="login-form-wrapper">
            <div className="login-header">
              <div className="login-logo">
                <Logo size={60} />
              </div>
              <h1>Portal Anggota</h1>
              <p>Masuk ke akun anggota Koperasi Merah Putih</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <Mail size={20} />
                  <input
                    type="email"
                    id="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Ingat saya</span>
                </label>
                <a href="#" className="forgot-password">Lupa password?</a>
              </div>

              <button type="submit" className="btn-login-submit">
                Masuk <ArrowRight size={20} />
              </button>
            </form>

            <div className="login-footer">
              <p>Belum menjadi anggota? <Link to="/daftar-anggota">Daftar Sekarang</Link></p>
            </div>
          </div>
        </div>

        <div className="login-illustration">
          <div className="illustration-content">
            <div className="illustration-badge">
              <span className="badge-dot"></span>
              Khusus Anggota Koperasi
            </div>
            <h2>Akses Informasi Koperasi Anda</h2>
            <p>Portal anggota memberikan kemudahan untuk mengakses informasi simpanan, pinjaman, dan SHU Anda secara real-time.</p>
            
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Cek Saldo Simpanan</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Riwayat Transaksi</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Informasi SHU</span>
              </div>
            </div>
          </div>

          <div className="illustration-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
