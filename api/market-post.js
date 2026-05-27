import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { steam_id, item_name, item_icon, price_usd, price_brl, description } = req.body;
    if (!steam_id || !item_name || !price_usd) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error } = await db.from("marketplace").insert({
      steam_id, item_name, item_icon, price_usd, price_brl, description,
      status: "active",
      created_at: Date.now(),
    });

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
