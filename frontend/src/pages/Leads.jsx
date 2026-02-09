import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadLeads();
    }, [filter]);

    async function loadLeads() {
        setLoading(true);
        try {
            const res = await api.getLeads(filter);
            if (res.success) {
                setLeads(res.data);
            }
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status) {
        switch (status) {
            case 'Belum Dihubungi':
                return <span className="status-badge pending">🟡 Belum Dihubungi</span>;
            case 'Sudah Dikirimi':
                return <span className="status-badge sent">✉️ Sudah Dikirimi</span>;
            case 'Tertarik':
                return <span className="status-badge interested">⭐ Tertarik</span>;
            case 'Tidak Tertarik':
                return <span className="status-badge" style={{ background: 'rgba(0,0,0,0.05)', color: '#666' }}>❌ Tidak Tertarik</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    }

    return (
        <div className="table-container">
            <div className="table-header">
                <h2 className="table-title">Daftar Dapur MBG</h2>
                <div className="table-filters">
                    <select
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="Belum Dihubungi">🟡 Belum Dihubungi</option>
                        <option value="Sudah Dikirimi">✉️ Sudah Dikirimi</option>
                        <option value="Tertarik">⭐ Tertarik</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Memuat data...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p>Belum ada data Dapur MBG</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Klik "Mulai Cari & Kirim Penawaran" di Beranda untuk mencari Dapur MBG
                    </p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                        Kembali ke Beranda
                    </Link>
                </div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Nama Dapur</th>
                            <th>Kota</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                                <td style={{ fontWeight: 500 }}>{lead.nama_sppg}</td>
                                <td>{lead.kab_kota}</td>
                                <td>{getStatusBadge(lead.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
