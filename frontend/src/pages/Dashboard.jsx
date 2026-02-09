import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import KPICard from '../components/KPICard';

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        sentToday: 0,
        interested: 0,
        pending: 0
    });
    const [systemStatus, setSystemStatus] = useState({ ready: false, mode: 'checking' });
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [statsRes, statusRes] = await Promise.all([
                api.getLeadStats(),
                api.getSystemStatus()
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (statusRes.success) setSystemStatus(statusRes.data);
        } catch (err) {
            console.error('Load error:', err);
        }
    }

    async function handleRunAutomation() {
        setIsRunning(true);
        setError(null);
        setResult(null);

        try {
            const res = await api.runAutomation();
            if (res.success) {
                setResult(res.data.summary);
                await loadData();
            } else {
                setError(res.error || 'Terjadi kesalahan. Silakan coba lagi.');
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div className="app">
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        🍞 <span>MBG Bread Workforce</span>
                    </Link>
                    <ul className="navbar-nav">
                        <li><Link to="/" className="nav-link active">Beranda</Link></li>
                        <li><Link to="/leads" className="nav-link">Daftar Dapur</Link></li>
                    </ul>
                </div>
            </nav>

            <main className="main-content">
                {/* KPI Cards */}
                <div className="kpi-grid">
                    <KPICard
                        label="Total Dapur MBG"
                        value={stats.total}
                    />
                    <KPICard
                        label="Pesan Terkirim Hari Ini"
                        value={stats.sentToday}
                    />
                    <KPICard
                        label="Dapur Tertarik"
                        value={stats.interested}
                        highlight
                    />
                    <KPICard
                        label="Status Sistem"
                        value={systemStatus.ready ? '✅ Siap' : '⏳ Menyiapkan'}
                        small
                    />
                </div>

                {/* Main Action */}
                <div className="main-action card">
                    <h2>Cari Dapur MBG & Kirim Penawaran Roti</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
                        Pesan dikirim sesuai standar MBG dan dapat dihentikan kapan saja
                    </p>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleRunAutomation}
                        disabled={isRunning}
                    >
                        {isRunning ? (
                            <>
                                <span className="loading-spinner"></span>
                                Sedang Mencari...
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">🔍</span>
                                Mulai Cari & Kirim Penawaran
                            </>
                        )}
                    </button>

                    {/* Result Panel */}
                    {result && (
                        <div style={{
                            marginTop: 'var(--spacing-xl)',
                            padding: 'var(--spacing-lg)',
                            background: 'rgba(45, 106, 79, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(45, 106, 79, 0.2)'
                        }}>
                            <h3 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>
                                ✅ Proses Selesai
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {result.newLeadsFound}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Dapur Baru Ditemukan
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {result.messagesGenerated}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Pesan Dibuat
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {result.messagesSent}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Pesan Terkirim
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
                                <Link to="/leads" className="btn btn-secondary">
                                    Lihat Daftar Dapur →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Error Panel */}
                    {error && (
                        <div style={{
                            marginTop: 'var(--spacing-xl)',
                            padding: 'var(--spacing-md)',
                            background: 'rgba(230, 57, 70, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(230, 57, 70, 0.2)',
                            color: 'var(--color-error)'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        Ringkasan Aktivitas
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Menunggu Respon</span>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{stats.pending || stats.sentToday}</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Mode Sistem</span>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                                {systemStatus.mode === 'simulation' ? '🧪 Simulasi' : '🚀 Produksi'}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
