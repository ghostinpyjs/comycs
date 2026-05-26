// pages/login.jsx
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function SteamIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 496 512" fill="currentColor">
      <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-75.2-239.1-177.4l95.7 39.6c6.6 32.4 35.5 56.8 70.2 56.8 39.1 0 70.9-32 70.9-71s-31.8-71-70.9-71l-1.4.1-66.7-97.4v-1.7c0-97.2 78.8-176 176-176s176 78.8 176 176zm-248 106.7c39.3 0 71-31.7 71-70.7s-31.8-70.7-71-70.7-71 31.7-71 70.7 31.8 70.7 71 70.7zm-98.7-214.5c0 40.3 26.8 73 63.4 82.7l-23.5-58.3c-14.4 0-26.1-11.7-26.1-26.1s11.7-26.1 26.1-26.1 26.1 11.7 26.1 26.1c0 8.3-3.9 15.6-10 20.2l25.3 62.5c32.3-16.4 54.6-50.1 54.6-89.1 0-55.2-44.8-100-100-100s-100 44.8-100 100z"/>
    </svg>
  );
}

export default function LoginPage({ steamUser }) {
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => { if (steamUser) router.replace('/'); }, [steamUser]);

  const errors = {
    auth_failed:     'Autenticação recusada pelo Steam. Tente novamente.',
    invalid_steamid: 'Não foi possível identificar sua conta Steam.',
    server_error:    'Erro interno. Tente novamente em instantes.',
  };

  return (
    <>
      <Head><title>Login — COMYCS</title></Head>
      <div className="login-page">
        <div className="login-grid"/>
        <div className="login-glow"/>
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-mark">
              <svg viewBox="0 0 18 18" fill="none" style={{width:20,height:20}}>
                <path d="M2 14L6 4L9 11L12 7L16 14" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="11" r="2" fill="#000"/>
              </svg>
            </div>
            <span className="login-logo-name">COM<span>YCS</span></span>
          </div>
          <h1 className="login-title">Entrar na plataforma</h1>
          <p className="login-sub">Conecte sua conta Steam para ver suas stats de CS2, inventário e interagir com a comunidade.</p>
          {error && <div className="login-error">⚠ {errors[error] || 'Ocorreu um erro. Tente novamente.'}</div>}
          <a href="/api/auth/steam" className="login-steam-btn">
            <SteamIcon size={20}/> Entrar com Steam
          </a>
          <div className="login-divider"><span>ou</span></div>
          <a href="/" className="login-guest-btn">Continuar sem login →</a>
          <p className="login-note">Ao entrar, você concorda com os Termos de Serviço da Steam. Seus dados são obtidos via Steam Web API e nunca armazenados permanentemente.</p>
        </div>
      </div>
    </>
  );
}
