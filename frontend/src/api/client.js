const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    return response.json();
}

export const api = {
    // Leads
    getLeads: (status) => {
        const params = status ? `?status=${encodeURIComponent(status)}` : '';
        return request(`/leads${params}`);
    },

    getLeadStats: () => request('/leads/stats'),

    getLeadDetail: (id) => request(`/leads/${id}`),

    updateLead: (id, data) => request(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    // Automation
    runAutomation: () => request('/automation/run', { method: 'POST' }),

    getSystemStatus: () => request('/automation/status'),

    generateMessage: (id) => request(`/automation/generate-message/${id}`, {
        method: 'POST'
    }),

    sendMessage: (id) => request(`/automation/send/${id}`, {
        method: 'POST'
    }),

    scanContact: (id) => request(`/automation/scan-contact/${id}`, {
        method: 'POST'
    })
};
