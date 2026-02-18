import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, User, MapPin, CreditCard, Phone, CheckCircle, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './DaftarAnggota.css';

const DaftarAnggota = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    nik: '',
    namaLengkap: '',
    jenisKelamin: '',
    tempatLahir: '',
    tanggalLahir: '',
    umur: '',
    jenisWarga: '',
    alamat: '',
    dusun: '',
    rt: '',
    desa: 'Purwajaya',
    kecamatan: 'Loa Janan',
    kabupaten: 'Kutai Kartanegara',
    provinsi: 'Kalimantan Timur',
    nomorRekening: '',
    namaBank: '',
    namaBankLainnya: '',
    atasNama: '',
    nomorWA: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const dusunList = ['Dusun 1', 'Dusun 2', 'Dusun 3', 'Dusun 4'];
  const rtList = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];
  const bankList = ['BRI', 'BNI', 'BCA', 'Mandiri', 'BTN', 'Bank Kaltim', 'Bank Lainnya'];

  useEffect(() => {
    if (formData.tanggalLahir) {
      const today = new Date();
      const birthDate = new Date(formData.tanggalLahir);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, umur: age.toString() }));
    }
  }, [formData.tanggalLahir]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nik') {
      const cleaned = value.replace(/\s/g, '');
      if (cleaned.length <= 16 && /^\d*$/.test(cleaned)) {
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }

    if (name === 'nomorWA') {
      let cleaned = value.replace(/\D/g, '');
      if (cleaned.startsWith('62')) {
        cleaned = cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
      }
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }

    if (name === 'jenisWarga') {
      if (value === 'warga_desa') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          desa: 'Purwajaya',
          kecamatan: 'Loa Janan',
          kabupaten: 'Kutai Kartanegara',
          provinsi: 'Kalimantan Timur'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dusun: '',
          desa: '',
          kecamatan: '',
          kabupaten: '',
          provinsi: ''
        }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.nik || formData.nik.replace(/\s/g, '').length !== 16) {
        newErrors.nik = 'NIK harus 16 digit';
      }
      if (!formData.namaLengkap) newErrors.namaLengkap = 'Nama lengkap wajib diisi';
      if (!formData.jenisKelamin) newErrors.jenisKelamin = 'Pilih jenis kelamin';
      if (!formData.tempatLahir) newErrors.tempatLahir = 'Tempat lahir wajib diisi';
      if (!formData.tanggalLahir) newErrors.tanggalLahir = 'Tanggal lahir wajib diisi';
    }

    if (step === 2) {
      if (!formData.jenisWarga) newErrors.jenisWarga = 'Pilih jenis warga';
      if (!formData.alamat) newErrors.alamat = 'Alamat wajib diisi';
      
      if (formData.jenisWarga === 'warga_desa') {
        if (!formData.dusun) newErrors.dusun = 'Pilih dusun';
        if (!formData.rt) newErrors.rt = 'Pilih RT';
      } else if (formData.jenisWarga === 'warga_luar') {
        if (!formData.rt) newErrors.rt = 'RT wajib diisi';
        if (!formData.desa) newErrors.desa = 'Desa/Kelurahan wajib diisi';
        if (!formData.kecamatan) newErrors.kecamatan = 'Kecamatan wajib diisi';
        if (!formData.kabupaten) newErrors.kabupaten = 'Kabupaten wajib diisi';
        if (!formData.provinsi) newErrors.provinsi = 'Provinsi wajib diisi';
      }
    }

    if (step === 3) {
      if (!formData.nomorRekening) newErrors.nomorRekening = 'Nomor rekening wajib diisi';
      if (!formData.namaBank) newErrors.namaBank = 'Pilih bank';
      if (formData.namaBank === 'Bank Lainnya' && !formData.namaBankLainnya) {
        newErrors.namaBankLainnya = 'Nama bank wajib diisi';
      }
      if (!formData.atasNama) newErrors.atasNama = 'Atas nama wajib diisi';
    }

    if (step === 4) {
      if (!formData.nomorWA || formData.nomorWA.length < 10) {
        newErrors.nomorWA = 'Nomor WhatsApp tidak valid';
      }
    }

    if (step === 5) {
      if (!formData.username || formData.username.length < 4) {
        newErrors.username = 'Username minimal 4 karakter';
      }
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak cocok';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      console.log('Form submitted:', formData);
      // TODO: Submit to API
      navigate('/login');
    }
  };

  const steps = [
    { number: 1, title: 'Data Pribadi', icon: User },
    { number: 2, title: 'Alamat', icon: MapPin },
    { number: 3, title: 'Info Bank', icon: CreditCard },
    { number: 4, title: 'Kontak', icon: Phone },
    { number: 5, title: 'Akun', icon: User }
  ];

  return (
    <div className="daftar-anggota-page">
      <div className="daftar-header">
        <Link to="/" className="back-link">
          ← Kembali ke Beranda
        </Link>
      </div>

      <div className="daftar-container">
        <div className="form-card">
          <div className="form-header">
            <Logo size={50} />
            <h1>Formulir Pendaftaran Anggota</h1>
            <p>Koperasi Desa Merah Putih</p>
          </div>

          {/* Stepper */}
          <div className="stepper">
            {steps.map((step, index) => (
              <div key={step.number} className="step-wrapper">
                <div className={`step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                  <div className="step-circle">
                    {currentStep > step.number ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <div className="step-label">{step.title}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-line ${currentStep > step.number ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="daftar-form">
            {/* Step 1: Data Pribadi */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="step-content">
                  <h2>Data Pribadi</h2>
                  <p className="step-description">Lengkapi data pribadi Anda dengan benar</p>

                  <div className="form-group">
                    <label htmlFor="nik">NIK <span className="required">*</span></label>
                    <input
                      type="text"
                      id="nik"
                      name="nik"
                      placeholder="1234 5678 9012 3456"
                      value={formData.nik}
                      onChange={handleChange}
                      className={errors.nik ? 'error' : ''}
                    />
                    {errors.nik && <span className="error-message">{errors.nik}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="namaLengkap">Nama Lengkap <span className="required">*</span></label>
                    <input
                      type="text"
                      id="namaLengkap"
                      name="namaLengkap"
                      placeholder="Masukkan nama lengkap sesuai KTP"
                      value={formData.namaLengkap}
                      onChange={handleChange}
                      className={errors.namaLengkap ? 'error' : ''}
                    />
                    {errors.namaLengkap && <span className="error-message">{errors.namaLengkap}</span>}
                  </div>

                  <div className="form-group">
                    <label>Jenis Kelamin <span className="required">*</span></label>
                    <div className="radio-group">
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="jenisKelamin"
                          value="laki-laki"
                          checked={formData.jenisKelamin === 'laki-laki'}
                          onChange={handleChange}
                        />
                        <span className="radio-content">
                          <span className="radio-title">Laki-laki</span>
                        </span>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="jenisKelamin"
                          value="perempuan"
                          checked={formData.jenisKelamin === 'perempuan'}
                          onChange={handleChange}
                        />
                        <span className="radio-content">
                          <span className="radio-title">Perempuan</span>
                        </span>
                      </label>
                    </div>
                    {errors.jenisKelamin && <span className="error-message">{errors.jenisKelamin}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="tempatLahir">Tempat Lahir <span className="required">*</span></label>
                      <input
                        type="text"
                        id="tempatLahir"
                        name="tempatLahir"
                        placeholder="Kota/Kabupaten"
                        value={formData.tempatLahir}
                        onChange={handleChange}
                        className={errors.tempatLahir ? 'error' : ''}
                      />
                      {errors.tempatLahir && <span className="error-message">{errors.tempatLahir}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="tanggalLahir">Tanggal Lahir <span className="required">*</span></label>
                      <input
                        type="date"
                        id="tanggalLahir"
                        name="tanggalLahir"
                        value={formData.tanggalLahir}
                        onChange={handleChange}
                        className={errors.tanggalLahir ? 'error' : ''}
                      />
                      {errors.tanggalLahir && <span className="error-message">{errors.tanggalLahir}</span>}
                    </div>
                  </div>

                  {formData.umur && (
                    <div className="info-box">
                      <CheckCircle size={20} />
                      <span>Umur Anda: <strong>{formData.umur} tahun</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Alamat */}
            {currentStep === 2 && (
              <div className="form-step">
                <div className="step-content">
                  <h2>Alamat Tempat Tinggal</h2>
                  <p className="step-description">Masukkan alamat lengkap Anda</p>

                  <div className="form-group">
                    <label htmlFor="jenisWarga">Jenis Warga <span className="required">*</span></label>
                    <select
                      id="jenisWarga"
                      name="jenisWarga"
                      value={formData.jenisWarga}
                      onChange={handleChange}
                      className={errors.jenisWarga ? 'error' : ''}
                    >
                      <option value="">Pilih Jenis Warga</option>
                      <option value="warga_desa">Warga Desa Purwajaya</option>
                      <option value="warga_luar">Warga Luar Desa Purwajaya</option>
                    </select>
                    {errors.jenisWarga && <span className="error-message">{errors.jenisWarga}</span>}
                  </div>

                  {formData.jenisWarga && (
                    <>
                      <div className="form-group">
                        <label htmlFor="alamat">Alamat Lengkap <span className="required">*</span></label>
                        <input
                          type="text"
                          id="alamat"
                          name="alamat"
                          placeholder="Jalan, Nomor Rumah, Patokan"
                          value={formData.alamat}
                          onChange={handleChange}
                          className={errors.alamat ? 'error' : ''}
                        />
                        {errors.alamat && <span className="error-message">{errors.alamat}</span>}
                      </div>

                      {formData.jenisWarga === 'warga_desa' ? (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="dusun">Dusun <span className="required">*</span></label>
                              <select
                                id="dusun"
                                name="dusun"
                                value={formData.dusun}
                                onChange={handleChange}
                                className={errors.dusun ? 'error' : ''}
                              >
                                <option value="">Pilih Dusun</option>
                                {dusunList.map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                              {errors.dusun && <span className="error-message">{errors.dusun}</span>}
                            </div>

                            <div className="form-group">
                              <label htmlFor="rt">RT <span className="required">*</span></label>
                              <select
                                id="rt"
                                name="rt"
                                value={formData.rt}
                                onChange={handleChange}
                                className={errors.rt ? 'error' : ''}
                              >
                                <option value="">Pilih RT</option>
                                {rtList.map(rt => (
                                  <option key={rt} value={rt}>{rt}</option>
                                ))}
                              </select>
                              {errors.rt && <span className="error-message">{errors.rt}</span>}
                            </div>
                          </div>

                          <div className="info-box success">
                            <CheckCircle size={20} />
                            <div>
                              <strong>Alamat Lengkap:</strong>
                              <p>{formData.desa}, Kec. {formData.kecamatan}, {formData.kabupaten}, {formData.provinsi}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="rt">RT <span className="required">*</span></label>
                              <input
                                type="text"
                                id="rt"
                                name="rt"
                                placeholder="001"
                                value={formData.rt}
                                onChange={handleChange}
                                className={errors.rt ? 'error' : ''}
                              />
                              {errors.rt && <span className="error-message">{errors.rt}</span>}
                            </div>

                            <div className="form-group">
                              <label htmlFor="desa">Desa/Kelurahan <span className="required">*</span></label>
                              <input
                                type="text"
                                id="desa"
                                name="desa"
                                placeholder="Nama Desa/Kelurahan"
                                value={formData.desa}
                                onChange={handleChange}
                                className={errors.desa ? 'error' : ''}
                              />
                              {errors.desa && <span className="error-message">{errors.desa}</span>}
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="kecamatan">Kecamatan <span className="required">*</span></label>
                              <input
                                type="text"
                                id="kecamatan"
                                name="kecamatan"
                                placeholder="Nama Kecamatan"
                                value={formData.kecamatan}
                                onChange={handleChange}
                                className={errors.kecamatan ? 'error' : ''}
                              />
                              {errors.kecamatan && <span className="error-message">{errors.kecamatan}</span>}
                            </div>

                            <div className="form-group">
                              <label htmlFor="kabupaten">Kabupaten <span className="required">*</span></label>
                              <input
                                type="text"
                                id="kabupaten"
                                name="kabupaten"
                                placeholder="Nama Kabupaten"
                                value={formData.kabupaten}
                                onChange={handleChange}
                                className={errors.kabupaten ? 'error' : ''}
                              />
                              {errors.kabupaten && <span className="error-message">{errors.kabupaten}</span>}
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="provinsi">Provinsi <span className="required">*</span></label>
                            <input
                              type="text"
                              id="provinsi"
                              name="provinsi"
                              placeholder="Nama Provinsi"
                              value={formData.provinsi}
                              onChange={handleChange}
                              className={errors.provinsi ? 'error' : ''}
                            />
                            {errors.provinsi && <span className="error-message">{errors.provinsi}</span>}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Info Bank */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-content">
                  <h2>Informasi Bank</h2>
                  <p className="step-description">Data rekening untuk pencairan SHU</p>

                  <div className="form-group">
                    <label htmlFor="namaBank">Nama Bank <span className="required">*</span></label>
                    <select
                      id="namaBank"
                      name="namaBank"
                      value={formData.namaBank}
                      onChange={handleChange}
                      className={errors.namaBank ? 'error' : ''}
                    >
                      <option value="" disabled>-- Pilih Bank --</option>
                      {bankList.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                    {errors.namaBank && <span className="error-message">{errors.namaBank}</span>}
                  </div>

                  {formData.namaBank === 'Bank Lainnya' && (
                    <div className="form-group">
                      <label htmlFor="namaBankLainnya">Nama Bank Lainnya <span className="required">*</span></label>
                      <input
                        type="text"
                        id="namaBankLainnya"
                        name="namaBankLainnya"
                        placeholder="Masukkan nama bank"
                        value={formData.namaBankLainnya}
                        onChange={handleChange}
                        className={errors.namaBankLainnya ? 'error' : ''}
                      />
                      {errors.namaBankLainnya && <span className="error-message">{errors.namaBankLainnya}</span>}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="nomorRekening">Nomor Rekening <span className="required">*</span></label>
                    <input
                      type="text"
                      id="nomorRekening"
                      name="nomorRekening"
                      placeholder="1234567890"
                      value={formData.nomorRekening}
                      onChange={handleChange}
                      className={errors.nomorRekening ? 'error' : ''}
                    />
                    {errors.nomorRekening && <span className="error-message">{errors.nomorRekening}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="atasNama">Atas Nama <span className="required">*</span></label>
                    <input
                      type="text"
                      id="atasNama"
                      name="atasNama"
                      placeholder="Nama pemilik rekening"
                      value={formData.atasNama}
                      onChange={handleChange}
                      className={errors.atasNama ? 'error' : ''}
                    />
                    {errors.atasNama && <span className="error-message">{errors.atasNama}</span>}
                    <small>Pastikan nama sesuai dengan nama di rekening bank</small>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Kontak */}
            {currentStep === 4 && (
              <div className="form-step">
                <div className="step-content">
                  <h2>Informasi Kontak</h2>
                  <p className="step-description">Nomor yang dapat dihubungi</p>

                  <div className="form-group">
                    <label htmlFor="nomorWA">Nomor WhatsApp <span className="required">*</span></label>
                    <input
                      type="text"
                      id="nomorWA"
                      name="nomorWA"
                      placeholder="628123456789"
                      value={formData.nomorWA}
                      onChange={handleChange}
                      className={errors.nomorWA ? 'error' : ''}
                    />
                    {errors.nomorWA && <span className="error-message">{errors.nomorWA}</span>}
                    <small>Format: 628xxx atau 08xxx (akan otomatis dikonversi)</small>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Akun & Disclaimer */}
            {currentStep === 5 && (
              <div className="form-step">
                <div className="step-content">
                  <h2>Buat Akun</h2>
                  <p className="step-description">Username dan password untuk login</p>

                  <div className="form-group">
                    <label htmlFor="username">Username <span className="required">*</span></label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Minimal 4 karakter"
                      value={formData.username}
                      onChange={handleChange}
                      className={errors.username ? 'error' : ''}
                    />
                    {errors.username && <span className="error-message">{errors.username}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Konfirmasi Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>

                  <div className="disclaimer-box">
                    <h3>Syarat & Ketentuan Keanggotaan</h3>
                    <div className="disclaimer-content">
                      <p>Dengan mendaftar sebagai anggota Koperasi Desa Merah Putih, saya menyatakan:</p>
                      <ul>
                        <li>Bersedia menyetorkan <strong>Iuran Pokok sebesar Rp 10.000</strong> (dibayarkan satu kali)</li>
                        <li>Bersedia menyetorkan <strong>Iuran Wajib sebesar Rp 100.000</strong> setiap bulan</li>
                        <li>Bersedia mentaati <strong>Anggaran Dasar (AD)</strong> dan <strong>Anggaran Rumah Tangga (ART)</strong> yang berlaku</li>
                        <li>Berkomitmen untuk aktif berpartisipasi dalam kegiatan koperasi</li>
                      </ul>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <span>Saya menyetujui syarat dan ketentuan di atas</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-prev">
                  <ArrowLeft size={20} /> Sebelumnya
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button type="button" onClick={nextStep} className="btn-next">
                  Selanjutnya <ArrowRight size={20} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={!agreedToTerms}
                >
                  Daftar Sekarang <CheckCircle size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DaftarAnggota;
