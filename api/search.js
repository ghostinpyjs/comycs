import { createClient } from "@supabase/supabase-js";

const getDB = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: "Min 2 chars" });

    const query = q.trim();
    const db    = getDB();

    if (/^\d{17}$/.test(query)) {
      const { data } = await db.from("players").select("*").eq("steam_id", query).single();
      return res.status(200).json({ players: data ? [data] : [] });
    }

    const { data } = await db.from("players").select("*").ilike("nick", `%${query}%`).limit(20);
    return res.status(200).json({ players: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
