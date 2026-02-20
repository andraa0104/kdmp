import { Users, TrendingUp, Wallet, Store, Handshake, Target, ArrowRight, MapPin, Phone, Mail, Facebook, Instagram, Youtube, Shield, Sparkles, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Modal from '../components/Modal';
import { statsService } from '../services/statsService';
import type { StatsData } from '../types/stats';
import '../App.css';

const Homepage = () => {
  const [stats, setStats] = useState<StatsData>({
    totalAnggota: 450,
    pertumbuhanPersen: 28,
    totalAset: 2800000
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode }>({ title: '', content: null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await statsService.getStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('id-ID');
  };

  const openModal = (title: string, content: React.ReactNode) => {
    setModalContent({ title, content });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo">
            <Logo size={40} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Koperasi Merah Putih</span>
            <span className="brand-subtitle">Desa Purwajaya</span>
          </div>
        </div>
        <div className="nav-links">
          <a href="#beranda">Beranda</a>
          <a href="#tentang">Tentang</a>
          <a href="#layanan">Layanan</a>
          <a href="#produk">Produk</a>
          <a href="#kontak">Kontak</a>
          <Link to="/login">
            <button className="btn-login">Portal Anggota</button>
          </Link>
        </div>
        <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#beranda" onClick={() => setMobileMenuOpen(false)}>Beranda</a>
          <a href="#tentang" onClick={() => setMobileMenuOpen(false)}>Tentang</a>
          <a href="#layanan" onClick={() => setMobileMenuOpen(false)}>Layanan</a>
          <a href="#produk" onClick={() => setMobileMenuOpen(false)}>Produk</a>
          <a href="#kontak" onClick={() => setMobileMenuOpen(false)}>Kontak</a>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            <button className="btn-login-mobile">Portal Anggota</button>
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section id="beranda" className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Sparkles size={20} />
              <span>Melayani Sejak 2025</span>
            </div>
            <h1 className="hero-title">
              Koperasi Desa
              <span className="gradient-text"> Merah Putih</span>
            </h1>
            <p className="hero-location">
              <MapPin size={20} />
              Desa Purwajaya, Kec. Loa Janan, Kalimantan Timur
            </p>
            <p className="hero-subtitle">
              Membangun ekonomi desa yang mandiri dan sejahtera melalui koperasi yang amanah, 
              transparan, dan berorientasi pada kesejahteraan anggota.
            </p>
            <div className="hero-buttons">
              <Link to="/daftar-anggota">
                <button className="btn-primary">
                  Daftar Anggota <ArrowRight size={20} />
                </button>
              </Link>
              <button className="btn-secondary">Pelajari Lebih Lanjut</button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-illustration">
              <div className="illustration-circle circle-1"></div>
              <div className="illustration-circle circle-2"></div>
              <div className="illustration-circle circle-3"></div>
              
              <div className="floating-element element-1">
                <Users size={32} />
                <div className="element-text">
                  <div className="element-label">Anggota</div>
                  <div className="element-value">{loading ? '...' : `${stats.totalAnggota}+`}</div>
                </div>
              </div>
              
              <div className="floating-element element-2">
                <TrendingUp size={32} />
                <div className="element-text">
                  <div className="element-label">Pertumbuhan</div>
                  <div className="element-value">{loading ? '...' : `+${stats.pertumbuhanPersen}%`}</div>
                </div>
              </div>
              
              <div className="floating-element element-3">
                <Wallet size={32} />
                <div className="element-text">
                  <div className="element-label">Aset</div>
                  <div className="element-value">{loading ? '...' : formatCurrency(stats.totalAset)}</div>
                </div>
              </div>
              
              <div className="center-logo">
                <Logo size={120} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="about">
        <div className="about-content">
          <div className="about-image">
            <div className="about-card">
              <Shield size={48} />
              <h3>Terpercaya & Amanah</h3>
              <p>Dikelola secara profesional dengan prinsip koperasi yang benar</p>
            </div>
          </div>
          <div className="about-text">
            <div className="section-badge">Tentang Kami</div>
            <h2 className="section-title">Koperasi Untuk Kesejahteraan Bersama</h2>
            <p className="about-description">
              Koperasi Desa Merah Putih didirikan pada tahun 2015 dengan tujuan meningkatkan 
              kesejahteraan ekonomi masyarakat Desa Purwajaya. Kami berkomitmen untuk memberikan 
              layanan terbaik kepada anggota melalui berbagai program simpan pinjam, usaha bersama, 
              dan pemberdayaan ekonomi desa.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-number">01</div>
                <div>
                  <h4>Visi Kami</h4>
                  <p>Menjadi koperasi desa terdepan yang mandiri dan mensejahterakan anggota</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-number">02</div>
                <div>
                  <h4>Misi Kami</h4>
                  <p>Memberikan layanan keuangan yang mudah, aman, dan menguntungkan bagi anggota</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-number">03</div>
                <div>
                  <h4>Nilai Kami</h4>
                  <p>Kejujuran, transparansi, gotong royong, dan orientasi pada kesejahteraan bersama</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="services">
        <div className="section-header">
          <div className="section-badge">Layanan Kami</div>
          <h2 className="section-title">Apa yang Kami Tawarkan</h2>
          <p className="section-subtitle">Berbagai layanan untuk mendukung kebutuhan ekonomi anggota</p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <Wallet size={32} />
            </div>
            <h3>Simpanan</h3>
            <p>Simpanan pokok, simpanan wajib, dan simpanan sukarela dengan bunga kompetitif</p>
            <a href="#" className="service-link" onClick={(e) => {
              e.preventDefault();
              openModal('Simpanan', (
                <>
                  <p>Koperasi Merah Putih menyediakan berbagai jenis simpanan untuk anggota dengan bunga yang kompetitif dan aman.</p>
                  <h3>Jenis Simpanan:</h3>
                  <ul>
                    <li><strong>Simpanan Pokok:</strong> Dibayarkan saat pertama kali menjadi anggota, tidak dapat diambil selama masih menjadi anggota</li>
                    <li><strong>Simpanan Wajib:</strong> Dibayarkan setiap bulan dengan nominal yang telah ditentukan</li>
                    <li><strong>Simpanan Sukarela:</strong> Dapat disetor dan diambil kapan saja sesuai kebutuhan</li>
                  </ul>
                  <div className="modal-info-box">
                    <h4>Keuntungan:</h4>
                    <p>Bunga kompetitif 8-10% per tahun, aman dan terjamin, dapat dijadikan jaminan pinjaman</p>
                  </div>
                </>
              ));
            }}>
              Selengkapnya <ArrowRight size={16} />
            </a>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <Handshake size={32} />
            </div>
            <h3>Pinjaman</h3>
            <p>Pinjaman modal usaha, pendidikan, dan kebutuhan mendesak dengan bunga ringan</p>
            <a href="#" className="service-link" onClick={(e) => {
              e.preventDefault();
              openModal('Pinjaman', (
                <>
                  <p>Kami menyediakan berbagai jenis pinjaman dengan proses cepat, bunga ringan, dan syarat mudah untuk membantu kebutuhan anggota.</p>
                  <h3>Jenis Pinjaman:</h3>
                  <ul>
                    <li><strong>Pinjaman Modal Usaha:</strong> Untuk pengembangan usaha anggota, maksimal Rp 50 juta</li>
                    <li><strong>Pinjaman Pendidikan:</strong> Untuk biaya pendidikan anak, maksimal Rp 20 juta</li>
                    <li><strong>Pinjaman Darurat:</strong> Untuk kebutuhan mendesak, maksimal Rp 10 juta</li>
                  </ul>
                  <div className="modal-info-box">
                    <h4>Syarat & Ketentuan:</h4>
                    <p>Bunga 1-1.5% per bulan, jangka waktu 6-24 bulan, proses persetujuan 3-5 hari kerja</p>
                  </div>
                </>
              ));
            }}>
              Selengkapnya <ArrowRight size={16} />
            </a>
          </div>

          <div className="service-card featured">
            <div className="featured-badge">Populer</div>
            <div className="service-icon">
              <Store size={32} />
            </div>
            <h3>Toko Koperasi</h3>
            <p>Penyediaan kebutuhan pokok dengan harga terjangkau untuk anggota</p>
            <a href="#" className="service-link" onClick={(e) => {
              e.preventDefault();
              openModal('Toko Koperasi', (
                <>
                  <p>Toko Koperasi Merah Putih menyediakan berbagai kebutuhan pokok dan produk lokal dengan harga lebih murah dari pasaran.</p>
                  <h3>Produk yang Tersedia:</h3>
                  <ul>
                    <li><strong>Sembako:</strong> Beras, gula, minyak goreng, telur, dan kebutuhan dapur lainnya</li>
                    <li><strong>Produk Lokal:</strong> Hasil pertanian dan kerajinan dari warga desa</li>
                    <li><strong>Kebutuhan Harian:</strong> Sabun, pasta gigi, deterjen, dan perlengkapan rumah tangga</li>
                  </ul>
                  <div className="modal-info-box">
                    <h4>Keuntungan Belanja di Toko Koperasi:</h4>
                    <p>Harga lebih murah 5-15% dari toko biasa, bisa kredit untuk anggota, kualitas terjamin, mendukung ekonomi lokal</p>
                  </div>
                </>
              ));
            }}>
              Selengkapnya <ArrowRight size={16} />
            </a>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <Target size={32} />
            </div>
            <h3>Pembagian SHU</h3>
            <p>Sisa Hasil Usaha dibagikan setiap tahun kepada anggota sesuai partisipasi</p>
            <a href="#" className="service-link" onClick={(e) => {
              e.preventDefault();
              openModal('Pembagian SHU', (
                <>
                  <p>Sisa Hasil Usaha (SHU) adalah keuntungan koperasi yang dibagikan kepada anggota setiap tahun berdasarkan partisipasi masing-masing.</p>
                  <h3>Cara Perhitungan SHU:</h3>
                  <ul>
                    <li><strong>Jasa Modal (60%):</strong> Berdasarkan total simpanan anggota</li>
                    <li><strong>Jasa Transaksi (40%):</strong> Berdasarkan aktivitas belanja dan pinjaman</li>
                  </ul>
                  <h3>Pembagian Laba Koperasi:</h3>
                  <ul>
                    <li>20% untuk PADes (Pendapatan Asli Desa)</li>
                    <li>20% untuk Anggota (SHU)</li>
                    <li>40% untuk Cadangan Modal</li>
                    <li>10% untuk Pengurus</li>
                    <li>10% untuk Dana Sosial & Pendidikan</li>
                  </ul>
                  <div className="modal-info-box">
                    <h4>Waktu Pembagian:</h4>
                    <p>SHU dibagikan setiap tahun setelah Rapat Anggota Tahunan (RAT), biasanya bulan Januari-Februari</p>
                  </div>
                </>
              ));
            }}>
              Selengkapnya <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produk" className="products">
        <div className="products-content">
          <div className="products-text">
            <div className="section-badge">Produk Unggulan</div>
            <h2 className="section-title">Produk Lokal Desa Purwajaya</h2>
            <p className="products-description">
              Kami mendukung UMKM lokal dengan memasarkan produk-produk unggulan dari 
              masyarakat Desa Purwajaya. Setiap pembelian Anda turut membantu ekonomi desa.
            </p>
            <div className="products-list">
              <div className="product-item">
                <div className="product-check">✓</div>
                <div>
                  <h4>Kerajinan Tangan</h4>
                  <p>Anyaman rotan dan bambu khas Kalimantan</p>
                </div>
              </div>
              <div className="product-item">
                <div className="product-check">✓</div>
                <div>
                  <h4>Hasil Pertanian</h4>
                  <p>Beras organik, sayuran segar, dan hasil kebun</p>
                </div>
              </div>
              <div className="product-item">
                <div className="product-check">✓</div>
                <div>
                  <h4>Makanan Olahan</h4>
                  <p>Kue tradisional, keripik, dan makanan ringan</p>
                </div>
              </div>
            </div>
            <button className="btn-primary">Lihat Semua Produk</button>
          </div>
          <div className="products-image">
            <div className="product-showcase">
              <div className="showcase-item">🌾</div>
              <div className="showcase-item">🧺</div>
              <div className="showcase-item">🍪</div>
              <div className="showcase-item">🥬</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Bergabung Bersama Kami</h2>
          <p>Mari bersama membangun ekonomi desa yang lebih baik dan sejahtera</p>
          <Link to="/daftar-anggota">
            <button className="btn-cta">
              Daftar Jadi Anggota <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontak" className="contact">
        <div className="contact-content">
          <div className="contact-info">
            <h2>Hubungi Kami</h2>
            <p>Kami siap melayani dan menjawab pertanyaan Anda</p>
            
            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-icon">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4>Alamat</h4>
                  <p>Jl. Jatah Dusun Marga Mulya RT. 14<br/>Desa Purwajaya, Kec. Loa Janan<br/>Kalimantan Timur 75391</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <Phone size={24} />
                </div>
                <div>
                  <h4>Telepon</h4>
                  <p>+62 541 123 4567<br/>+62 812 3456 7890</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <Mail size={24} />
                </div>
                <div>
                  <h4>Email</h4>
                  <p>info@koperasimerahputih.id<br/>admin@koperasimerahputih.id</p>
                </div>
              </div>
            </div>

            <div className="social-media">
              <h4>Ikuti Kami</h4>
              <div className="social-links">
                <a href="#" className="social-link">
                  <Facebook size={20} />
                </a>
                <a href="#" className="social-link">
                  <Instagram size={20} />
                </a>
                <a href="#" className="social-link">
                  <Youtube size={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h3>Kirim Pesan</h3>
            <form>
              <div className="form-group">
                <input type="text" placeholder="Nama Lengkap" />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email" />
              </div>
              <div className="form-group">
                <input type="tel" placeholder="No. Telepon" />
              </div>
              <div className="form-group">
                <textarea placeholder="Pesan Anda" rows={5}></textarea>
              </div>
              <button type="submit" className="btn-submit">Kirim Pesan</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <Logo size={32} />
              <span>Koperasi Merah Putih</span>
            </div>
            <p>Membangun ekonomi desa yang mandiri dan sejahtera melalui koperasi yang amanah dan transparan.</p>
          </div>
          <div className="footer-section">
            <h4>Layanan</h4>
            <a href="#">Simpanan</a>
            <a href="#">Pinjaman</a>
            <a href="#">Toko Koperasi</a>
            <a href="#">Pembagian SHU</a>
          </div>
          <div className="footer-section">
            <h4>Informasi</h4>
            <a href="#">Tentang Kami</a>
            <a href="#">Struktur Organisasi</a>
            <a href="#">Laporan Tahunan</a>
            <a href="#">Berita</a>
          </div>
          <div className="footer-section">
            <h4>Bantuan</h4>
            <a href="#">FAQ</a>
            <a href="#">Syarat & Ketentuan</a>
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Kontak</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Koperasi Desa Merah Putih. Desa Purwajaya, Kec. Loa Janan.</p>
        </div>
      </footer>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={modalContent.title}>
        {modalContent.content}
      </Modal>
    </div>
  );
};

export default Homepage;
