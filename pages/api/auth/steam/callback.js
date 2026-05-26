// pages/api/auth/steam/callback.js
// Valida a resposta OpenID do Steam e retorna o SteamID64
export default async function handler(req, res) {
  const params = Object.entries(req.query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const body = params.replace(
    encodeURIComponent('openid.mode') + '=' + encodeURIComponent('id_res'),
    encodeURIComponent('openid.mode') + '=check_authentication'
  );

  try {
    const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await verifyRes.text();
    if (!text.includes('is_valid:true')) {
      console.error('Steam validation failed:', text);
      return res.redirect('/?error=auth_failed');
    }
    const claimedId = req.query['openid.claimed_id'] || '';
    const match = claimedId.match(/(\d{17})$/);
    if (!match) {
      console.error('SteamID not found in claimed_id:', claimedId);
      return res.redirect('/?error=invalid_steamid');
    }
    return res.redirect(`/?steamid=${match[1]}&login=success`);
  } catch (err) {
    console.error('Steam auth callback error:', err);
    return res.redirect('/?error=server_error');
  }
}
