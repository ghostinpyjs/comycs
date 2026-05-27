import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data: listings, error } = await db
      .from("marketplace")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Buscar nicks e avatares dos vendedores
    const steamIds = [...new Set((listings || []).map(l => l.steam_id))];
    let players = [];
    if (steamIds.length) {
      const { data } = await db.from("players").select("steam_id, nick, avatar").in("steam_id", steamIds);
      players = data || [];
    }

    const playerMap = {};
    players.forEach(p => playerMap[p.steam_id] = p);

    const result = (listings || []).map(l => ({
      ...l,
      nick:   playerMap[l.steam_id]?.nick   || "Jogador",
      avatar: playerMap[l.steam_id]?.avatar || "",
    }));

    return res.status(200).json({ listings: result });
  } catch (err) {
    console.error("market-list error:", err);
    return res.status(500).json({ error: err.message });
  }
}
