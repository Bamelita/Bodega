import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { FileText } from 'lucide-react';

const AdminAudit = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        api.get('/settings/audit')
            .then(res => setLogs(res.data || []))
            .catch(() => { });
    }, []);

    return (
        <div className="page active">
            <div className="section-header mb-3">
                <div className="section-title flex items-center gap-2">
                    <FileText className="text-[var(--purple)]" size={20} /> Registro de Auditoría
                </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">Historial de acciones y eventos del sistema.</p>

            <div className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Acción</th>
                                <th>Detalle</th>
                                <th>Admin</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="fw-8 text-[var(--purple)]">{log.action}</td>
                                    <td>{log.detail}</td>
                                    <td className="text-[var(--muted)]">{log.admin}</td>
                                    <td className="text-[var(--muted)]">{new Date(log.date).toLocaleString()}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-[var(--muted)]">No hay registros de auditoría.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAudit;
