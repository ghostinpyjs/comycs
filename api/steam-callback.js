import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const fullUrl = `https://${req.headers.host}${req.url}`;
    const params = new URLSearchParams(new URL(fullUrl).search);
    const claimed_id = params.get("openid.claimed_id") || "";
    const steamId = claimed_id.match(/\/id\/(\d+)$/)?.[1];

    if (!steamId) return res.redirect("/?error=no_steamid");

    // Verificar com Steam
    params.set("openid.mode", "check_authentication");
    const verify = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const text = await verify.text();
    if (!text.includes("is_valid:true")) return res.redirect("/?error=invalid");

    // Buscar perfil Steam
    const pRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    );
    const pData = await pRes.json();
    const player = pData?.response?.players?.[0];
    if (!player) return res.redirect("/?error=no_profile");

    // Salvar no Supabase
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    await db.from("players").upsert({
      steam_id: steamId,
      nick: player.personaname,
      avatar: player.avatarfull,
      profile_url: player.profileurl,
      last_login: Date.now(),
    }, { onConflict: "steam_id", ignoreDuplicates: false });

    // Buscar stats CS2
    const sRes = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&appid=730`
    );
    if (sRes.ok) {
      const sData = await sRes.json();
      const stats = sData?.playerstats?.stats ?? [];
      const g = (n) => stats.find(s => s.name === n)?.value ?? 0;
      const kills = g("total_kills");
      const deaths = g("total_deaths");
      const hs = g("total_kills_headshot");
      const kd = deaths > 0 ? (kills / deaths).toFixed(2) : "0.00";
      const hsPercent = kills > 0 ? ((hs / kills) * 100).toFixed(1) : "0.0";
      const lvlRes = await fetch(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`);
      const lvlData = await lvlRes.json();
      const steam_level = lvlData?.response?.player_level ?? 0;
      await db.from("players").update({
        kills, deaths, kd, hs_percent: hsPercent,
        mvps: g("total_mvps"), wins: g("total_wins"),
        steam_level, last_updated: Date.now(),
      }).eq("steam_id", steamId);
    }

    // Redirecionar com dados do usuário na URL
    const userData = encodeURIComponent(JSON.stringify({
      steam_id: steamId,
      nick: player.personaname,
      avatar: player.avatarfull,
    }));
    return res.redirect(`/?login=${userData}`);

  } catch (err) {
    console.error(err);
    return res.redirect("/?error=server_error");
  }
}
