import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function LeadDetail() {
    const { id } = useParams();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        loadLead();
    }, [id]);

    async function loadLead() {
        setLoading(true);
        try {
            const res = await api.getLeadDetail(id);
            if (res.success) {
                setLead(res.data);
                setEditedMessage(res.data.pesan_penawaran || '');
            }
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    }

    function showNotification(message, type = 'success') {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    }

    async function handleGenerateMessage() {
        setIsGenerating(true);
        try {
            const res = await api.generateMessage(id);
            if (res.success) {
                await loadLead();
                showNotification('Pesan berhasil dibuat');
            } else {
                showNotification(res.error || 'Gagal membuat pesan', 'error');
            }
        } catch (err) {
            showNotification('Terjadi kesalahan', 'error');
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleSendMessage() {
        if (!lead.pesan_penawaran && !editedMessage) {
            showNotification('Pesan belum dibuat', 'error');
            return;
        }

        setIsSending(true);
        try {
            // Save edited message first if changed
            if (isEditing && editedMessage !== lead.pesan_penawaran) {
                await api.updateLead(id, { pesan_penawaran: editedMessage });
            }

            const res = await api.sendMessage(id);
            if (res.success) {
                await loadLead();
                setIsEditing(false);
                showNotification('Pesan berhasil dikirim');
            } else {
                showNotification(res.error || 'Gagal mengirim pesan', 'error');
            }
        } catch (err) {
            showNotification('Terjadi kesalahan', 'error');
        } finally {
            setIsSending(false);
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
            default:
                return <span className="status-badge">{status}</span>;
        }
    }

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Memuat data...</p>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="empty-state">
                <p>Data tidak ditemukan</p>
                <Link to="/leads" className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                    Kembali ke Daftar
                </Link>
            </div>
        );
    }

    const charCount = (isEditing ? editedMessage : lead.pesan_penawaran || '').length;
    const charClass = charCount > 700 ? 'error' : charCount > 600 ? 'warning' : '';

    return (
        <>
            <div className="lead-detail">
                <Link to="/leads" className="back-link">
                    ← Kembali ke Daftar
                </Link>

                <div className="card">
                    <div className="lead-header">
                        <h1>{lead.nama_sppg}</h1>
                        <p className="lead-location">
                            📍 {lead.kab_kota}, {lead.provinsi}
                        </p>
                    </div>

                    <div className="lead-info-grid">
                        <div className="info-item">
                            <div className="info-label">Status</div>
                            <div className="info-value">{getStatusBadge(lead.status)}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Telepon</div>
                            <div className="info-value">{lead.phone || '-'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Kecamatan</div>
                            <div className="info-value">{lead.kecamatan || '-'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Alamat</div>
                            <div className="info-value">{lead.alamat || '-'}</div>
                        </div>
                    </div>

                    <div className="message-section">
                        <h3>💬 Pesan Penawaran WhatsApp</h3>

                        {!lead.pesan_penawaran && !isEditing ? (
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)'
                            }}>
                                <p>Pesan belum dibuat</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGenerateMessage}
                                    disabled={isGenerating}
                                    style={{ marginTop: 'var(--spacing-md)' }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Membuat Pesan...
                                        </>
                                    ) : (
                                        '✨ Buat Pesan Otomatis'
                                    )}
                                </button>
                            </div>
                        ) : isEditing ? (
                            <div>
                                <textarea
                                    className="edit-message-area"
                                    value={editedMessage}
                                    onChange={(e) => setEditedMessage(e.target.value)}
                                    placeholder="Tulis pesan penawaran..."
                                />
                                <div className={`char-count ${charClass}`}>
                                    {charCount}/700 karakter
                                </div>
                            </div>
                        ) : (
                            <div className="whatsapp-bubble">
                                {lead.pesan_penawaran}
                            </div>
                        )}
                    </div>

                    <div className="message-actions">
                        {lead.status === 'Belum Dihubungi' || lead.status === 'Sudah Dikirimi' ? (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSendMessage}
                                    disabled={isSending || (!lead.pesan_penawaran && !editedMessage)}
                                >
                                    {isSending ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Mengirim...
                                        </>
                                    ) : lead.status === 'Sudah Dikirimi' ? (
                                        '📨 Kirim Ulang Pesan'
                                    ) : (
                                        '📨 Kirim Pesan'
                                    )}
                                </button>

                                {isEditing ? (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedMessage(lead.pesan_penawaran || '');
                                        }}
                                    >
                                        Batal Edit
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        ✏️ Edit Pesan
                                    </button>
                                )}
                            </>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                Status sudah diperbarui. Tidak perlu kirim lagi.
                            </div>
                        )}
                    </div>

                    {/* Conversation History */}
                    {lead.messages && lead.messages.length > 0 && (
                        <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                📜 Riwayat Pengiriman
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {lead.messages.map((msg, idx) => (
                                    <div key={idx} style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>
                                            {new Date(msg.sent_at).toLocaleString('id-ID')}
                                        </span>
                                        <span style={{ margin: '0 var(--spacing-sm)' }}>•</span>
                                        <span>{msg.direction === 'outgoing' ? '📤 Terkirim' : '📥 Diterima'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {notification && (
                <div className="toast-container">
                    <div className={`toast ${notification.type}`}>
                        {notification.message}
                    </div>
                </div>
            )}
        </>
    );
}
