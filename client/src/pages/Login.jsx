import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, User, Eye, EyeOff, Moon, Sun, ArrowRight } from 'lucide-react';
import BrandIcon from '../components/BrandIcon';
import api from '../config/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: New Password
  const [resetUserId, setResetUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Existing login handler...
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } else {
      setError(res.message);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/verify-email', { email: resetEmail });
      if (res.data.success) {
        setResetUserId(res.data.userId);
        if (res.data.devOtp) {
          setOtp(res.data.devOtp); // Auto-fill for dev/demo mode
        }
        setResetStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al verificar correo');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await api.post('/auth/reset-password', { userId: resetUserId, otp, newPassword });
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetting(false);
        setResetSuccess(false);
        setResetStep(1);
        setResetEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar contraseña');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent transition-colors duration-300 relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full card text-ink2 hover:scale-110 transition-all z-10 flex items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-white)]"
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="w-full max-w-md p-4 flex justify-center">
        <div className="card w-full">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="brand-icon mb-4" style={{ width: '64px', height: '64px', borderRadius: '18px' }}>
                <BrandIcon size={40} />
              </div>
              <h1 className="brand-name text-3xl mb-1">Invexis</h1>
              <p className="text-[var(--muted)] text-sm font-semibold text-center">
                {isResetting ? (resetStep === 1 ? 'Recuperar Contraseña' : 'Establecer Nueva Contraseña') : 'Ingresa tus credenciales para acceder'}
              </p>
            </div>

            {error && (
              <div className="alert-banner alert-danger mb-6">
                <div className="flex-1 text-center">{error}</div>
              </div>
            )}

            {resetSuccess && (
              <div className="alert-banner alert-warning mb-6 !bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]">
                <div className="flex-1 text-center">Contraseña actualizada exitosamente. Redirigiendo al login...</div>
              </div>
            )}

            {!isResetting ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="field">
                  <label>Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--purple)] transition-colors" size={18} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingrese su usuario"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--purple)] transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center py-3 mt-4 text-[0.85rem]"
                >
                  Iniciar Sesión <ArrowRight size={18} />
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-sm text-[var(--purple)] hover:text-[var(--pink)] transition-colors hover:underline font-bold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {resetStep === 1 ? (
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="field">
                      <label>Correo Electrónico</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        required
                      />
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Ingrese el correo asociado a su cuenta para verificar.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-full justify-center py-3 mt-2 text-[0.85rem]"
                    >
                      Verificar Correo
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="field">
                      <label>Código de verificación (OTP)</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Código de 6 dígitos"
                        required
                        className="text-center tracking-widest font-mono text-lg"
                      />
                    </div>
                    <div className="field">
                      <label>Nueva Contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Confirmar Contraseña</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar contraseña"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-full justify-center py-3 mt-2 text-[0.85rem]"
                    >
                      Restablecer Contraseña
                    </button>
                  </form>
                )}

                <button
                  onClick={() => {
                    setIsResetting(false);
                    setResetStep(1);
                    setError('');
                  }}
                  className="w-full text-[var(--muted)] hover:text-[var(--ink)] text-sm font-bold transition-colors mt-2"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
