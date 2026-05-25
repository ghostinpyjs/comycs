// pages/_app.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [steamUser, setSteamUser] = useState(null);

  // Lê o SteamID64 da URL após o callback de login
  useEffect(() => {
    const { steamid, login, error } = router.query;

    if (login === 'success' && steamid) {
      // Salva no sessionStorage para persistir durante a sessão
      sessionStorage.setItem('steamid', steamid);

      // Busca o perfil e salva os dados do usuário
      fetch(`/api/player?steamid=${steamid}`)
        .then(r => r.json())
        .then(data => {
          const player = data?.response?.players?.[0];
          if (player) {
            const userData = {
              steamid: player.steamid,
              username: player.personaname,
              avatar: player.avatarmedium || player.avatar,
              profileUrl: player.profileurl,
            };
            setSteamUser(userData);
            sessionStorage.setItem('steamUser', JSON.stringify(userData));
          }
        })
        .catch(console.error);

      // Remove os parâmetros da URL para limpar o histórico
      const cleanUrl = router.pathname;
      router.replace(cleanUrl, undefined, { shallow: true });
    }

    if (error) {
      console.error('Steam login error:', error);
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query]);

  // Restaura o usuário do sessionStorage ao recarregar a página
  useEffect(() => {
    const saved = sessionStorage.getItem('steamUser');
    if (saved) {
      try {
        setSteamUser(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem('steamUser');
      }
    }
  }, []);

  const handleLogout = () => {
    setSteamUser(null);
    sessionStorage.removeItem('steamid');
    sessionStorage.removeItem('steamUser');
  };

  return (
    <>
      <Component
        {...pageProps}
        steamUser={steamUser}
        setSteamUser={setSteamUser}
        onLogout={handleLogout}
      />
      {/* Vercel Analytics — rastreia page views automaticamente */}
      <Analytics />
    </>
  );
}
