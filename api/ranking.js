import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    return res.status(500).json({ error: "Variáveis faltando", has_url: !!url, has_key: !!key });
  }

  try {
    const db = createClient(url, key);

    // Teste direto sem filtro
    const { data, count, error } = await db
      .from("players")
      .select("steam_id, nick", { count: "exact" });

    return res.status(200).json({ 
      debug: true,
      count,
      rows: data,
      error: error?.message || null,
      url_start: url.substring(0, 30)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
