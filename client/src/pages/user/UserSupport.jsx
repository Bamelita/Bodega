import React, { useState } from 'react';
import api from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Send } from 'lucide-react';

const UserSupport = () => {
    const [subject, setSubject] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !text.trim()) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await api.post('/support/messages', { subject, text });
            toast.success('Reporte enviado correctamente. El administrador lo revisará pronto.');
            setSubject('');
            setText('');
        } catch (error) {
            toast.error('Error al enviar el reporte. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page active">
            <div className="section-header mb-4">
                <div className="section-title flex items-center gap-2">
                    <MessageSquare className="text-[var(--purple)]" size={20} /> 
                    <span>Reportes / Soporte <small>¿Encontraste un fallo o necesitas ayuda? Envía un reporte al administrador.</small></span>
                </div>
            </div>

            <div className="card max-w-2xl p-6">
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Asunto / Tema</label>
                        <input 
                            type="text" 
                            placeholder="Ej. Fallo al guardar un producto..." 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Detalles del reporte</label>
                            <textarea 
                                rows="5" 
                                placeholder="Describe el problema detalladamente..."
                                value={text}
                            onChange={(e) => setText(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-white)', color: 'var(--ink)' }}
                        ></textarea>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Send size={16} />
                            {loading ? 'Enviando...' : 'Enviar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserSupport;
