export default async function handler(req, res) {
  const { vanity } = req.query;
  const API_KEY = process.env.STEAM_API_KEY;
  if (!vanity) return res.status(400).json({ error: 'vanity required' });
  if (/^\d{17}$/.test(vanity)) return res.status(200).json({ steamid: vanity });
  try {
    const r = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${API_KEY}&vanityurl=${vanity}`);
    const d = await r.json();
    if (d.response?.success === 1) return res.status(200).json({ steamid: d.response.steamid });
    return res.status(404).json({ error: 'Perfil Steam não encontrado' });
  } catch {
    return res.status(500).json({ error: 'Falha ao resolver URL' });
  }
}
