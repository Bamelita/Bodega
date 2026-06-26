import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'admin' ? '/admin' : user ? '/user' : '/login';
  const dashboardLabel = user ? 'Volver al Dashboard' : 'Ir al Login';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      {/* Big 404 */}
      <div
        style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 800,
          lineHeight: 1,
          background: 'linear-gradient(135deg, var(--purple), var(--pink))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-4px',
        }}
      >
        404
      </div>

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
          Página no encontrada
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '360px' }}>
          La ruta que buscas no existe o fue movida. Usa el botón de abajo para volver al inicio.
        </p>
      </div>

      <Link
        to={dashboardPath}
        className="btn btn-primary"
        style={{ padding: '0.65rem 1.8rem' }}
      >
        {dashboardLabel}
      </Link>
    </div>
  );
};

export default NotFound;
