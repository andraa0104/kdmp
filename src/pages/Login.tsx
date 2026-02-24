import { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import kdmpLogo from '../assets/logo kdmp purwajaya remove BG HD.png';
import { authService } from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      
      // Save session
      authService.saveSession(response);

      // Redirect based on user type
      if (response.data.userType === 'admin') {
        navigate('/superadmin');
      } else {
        navigate('/portal-anggota');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
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
                <Logo size={80} />
                <img src={kdmpLogo} alt="KDMP Purwajaya" className="kdmp-logo" />
              </div>
              <h1>Portal Koperasi</h1>
              <p>Masuk untuk anggota, admin, bendahara, dan ketua</p>
            </div>

            {error && (
              <div className="login-error">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <User size={20} />
                  <input
                    type="text"
                    id="username"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={isLoading} />
                  <span>Ingat saya</span>
                </label>
                <a href="#" className="forgot-password">Lupa password?</a>
              </div>

              <button type="submit" className="btn-login-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spinner" /> Memproses...
                  </>
                ) : (
                  <>
                    Masuk <ArrowRight size={20} />
                  </>
                )}
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
              Portal Koperasi Merah Putih
            </div>
            <h2>Akses Informasi Koperasi Anda</h2>
            <p>Portal memberikan kemudahan untuk mengakses informasi simpanan, pinjaman, dan mengelola koperasi secara digital.</p>
            
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Anggota - Cek Status & Saldo</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Admin - Kelola Anggota</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">✓</div>
                <span>Bendahara - Kelola Keuangan</span>
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
