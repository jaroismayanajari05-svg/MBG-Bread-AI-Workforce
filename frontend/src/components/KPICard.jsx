export default function KPICard({ label, value, highlight, small }) {
    return (
        <div className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div
                className={`kpi-value ${highlight ? 'gold' : ''}`}
                style={small ? { fontSize: 'var(--font-size-xl)' } : {}}
            >
                {value}
            </div>
        </div>
    );
}
