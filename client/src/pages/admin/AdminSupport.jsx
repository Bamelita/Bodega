import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { MessageSquare } from 'lucide-react';

const AdminSupport = () => {
    const [msgs, setMsgs] = useState([]);

    const fetchMessages = () => {
        api.get('/support/messages')
            .then(res => setMsgs(res.data || []))
            .catch(() => { });
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/support/messages/${id}/read`);
            fetchMessages();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="page active">
            <div className="section-header mb-4">
                <div className="section-title flex items-center gap-2">
                    <MessageSquare className="text-[var(--purple)]" size={20} /> 
                    <span>Bandeja de Soporte <small>Gestiona las consultas y tickets de suscriptores.</small></span>
                </div>
            </div>

            <div className="space-y-4">
                {msgs.map(msg => (
                    <div key={msg.id} className={`card p-4 ${msg.read ? '' : 'border border-[var(--purple)]'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold">{msg.subject}</h3>
                                <p className="text-xs text-[var(--muted)]">De: {msg.user} • {new Date(msg.date).toLocaleString()}</p>
                            </div>
                            {!msg.read && <span className="badge badge-active">Nuevo</span>}
                        </div>
                        <p className="text-sm mb-3">{msg.text}</p>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost border border-[var(--glass-border)]">Responder</button>
                            {!msg.read && (
                                <button 
                                    className="btn btn-ghost text-[var(--muted)] border-0"
                                    onClick={() => handleMarkAsRead(msg.id)}
                                >
                                    Marcar como leído
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {msgs.length === 0 && (
                    <div className="card p-8 text-center">
                        <p className="text-[var(--muted)]">No hay mensajes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
