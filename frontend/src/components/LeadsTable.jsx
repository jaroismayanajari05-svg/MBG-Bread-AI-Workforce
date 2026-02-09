import { useNavigate } from 'react-router-dom';

function getStatusEmoji(status) {
    switch (status) {
        case 'Belum Dihubungi': return '🟡';
        case 'Sudah Dikirimi': return '✉️';
        case 'Tertarik': return '⭐';
        case 'Tidak Tertarik': return '❌';
        case 'Eskalasi': return '⚠️';
        default: return '⚪';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Belum Dihubungi': return 'pending';
        case 'Sudah Dikirimi': return 'sent';
        case 'Tertarik': return 'interested';
        default: return '';
    }
}

function LeadsTable({ leads, loading }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <span>Memuat data...</span>
            </div>
        );
    }

    if (!leads || leads.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Belum ada data Dapur MBG</p>
                <p>Klik tombol "Cari & Kirim Penawaran" di Dashboard untuk memulai</p>
            </div>
        );
    }

    return (
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
                    <tr key={lead.id} onClick={() => navigate(`/dapur/${lead.id}`)}>
                        <td>{lead.nama_sppg}</td>
                        <td>{lead.kab_kota || '-'}</td>
                        <td>
                            <span className={`status-badge ${getStatusClass(lead.status)}`}>
                                {getStatusEmoji(lead.status)} {lead.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default LeadsTable;
