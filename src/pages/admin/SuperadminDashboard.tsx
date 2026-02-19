import { Users, Wallet, TrendingUp, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import './SuperadminDashboard.css';

const SuperadminDashboard = () => {
  const stats = [
    {
      icon: Users,
      label: 'Total Anggota',
      value: '1,234',
      change: '+28%',
      trend: 'up',
      color: 'blue'
    },
    {
      icon: Wallet,
      label: 'Total Simpanan',
      value: 'Rp 2.8M',
      change: '+15%',
      trend: 'up',
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Total Pinjaman',
      value: 'Rp 1.5M',
      change: '+8%',
      trend: 'up',
      color: 'orange'
    },
    {
      icon: DollarSign,
      label: 'SHU Tahun Ini',
      value: 'Rp 500K',
      change: '-5%',
      trend: 'down',
      color: 'purple'
    }
  ];

  const recentTransactions = [
    { id: 1, date: '15/01/2024', member: 'Budi Santoso', type: 'Simpanan', amount: 'Rp 500,000', status: 'success' },
    { id: 2, date: '15/01/2024', member: 'Ani Wijaya', type: 'Pinjaman', amount: 'Rp 2,000,000', status: 'pending' },
    { id: 3, date: '14/01/2024', member: 'Joko Prabowo', type: 'Angsuran', amount: 'Rp 300,000', status: 'success' },
    { id: 4, date: '14/01/2024', member: 'Siti Nurhaliza', type: 'Simpanan', amount: 'Rp 750,000', status: 'success' },
    { id: 5, date: '13/01/2024', member: 'Andi Wijaya', type: 'Pinjaman', amount: 'Rp 5,000,000', status: 'success' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Selamat datang kembali, Super Admin!</p>
        </div>
        <button className="btn-primary">
          <span>Export Laporan</span>
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <h3 className="stat-value">{stat.value}</h3>
                <div className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>Pertumbuhan Anggota</h3>
            <select className="chart-filter">
              <option>12 Bulan Terakhir</option>
              <option>6 Bulan Terakhir</option>
              <option>3 Bulan Terakhir</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[40, 65, 55, 80, 70, 90, 75, 85, 95, 88, 92, 100].map((height, i) => (
                <div key={i} className="chart-bar" style={{ height: `${height}%` }}>
                  <div className="bar-fill"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Komposisi Simpanan</h3>
          </div>
          <div className="pie-chart">
            <div className="pie-item">
              <div className="pie-color" style={{ background: '#dc2626' }}></div>
              <span>Simpanan Pokok</span>
              <strong>30%</strong>
            </div>
            <div className="pie-item">
              <div className="pie-color" style={{ background: '#fbbf24' }}></div>
              <span>Simpanan Wajib</span>
              <strong>50%</strong>
            </div>
            <div className="pie-item">
              <div className="pie-color" style={{ background: '#10b981' }}></div>
              <span>Simpanan Sukarela</span>
              <strong>20%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3>Transaksi Terbaru</h3>
          <a href="#" className="view-all">Lihat Semua</a>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Anggota</th>
                <th>Jenis</th>
                <th>Jumlah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td>{transaction.member}</td>
                  <td>
                    <span className="badge badge-info">{transaction.type}</span>
                  </td>
                  <td className="amount">{transaction.amount}</td>
                  <td>
                    <span className={`badge badge-${transaction.status}`}>
                      {transaction.status === 'success' ? '✓ Lunas' : '⏳ Proses'}
                    </span>
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

export default SuperadminDashboard;
