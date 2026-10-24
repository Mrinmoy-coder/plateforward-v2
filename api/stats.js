import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
    const sql = neon(process.env.DATABASE_URL);
    await sql`UPDATE donations SET status='Expired', updated_at=now() WHERE status='Available' AND expiry_at <= now()`;
    const rows = await sql`
      SELECT COUNT(*)::int AS total_donations,
      COALESCE(SUM(quantity_kg) FILTER (WHERE status='Delivered'),0)::numeric AS food_delivered_kg,
      COALESCE(SUM(servings) FILTER (WHERE status='Delivered'),0)::int AS meals_delivered,
      COUNT(*) FILTER (WHERE status='Available')::int AS available_now,
      COUNT(*) FILTER (WHERE status IN ('Claimed','Picked up'))::int AS in_progress
      FROM donations`;
    const events = await sql`SELECT id,donation_id,event_type,actor_name,details,created_at FROM donation_events ORDER BY created_at DESC LIMIT 10`;
    return res.status(200).json({ stats: rows[0], events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message?.includes("DATABASE_URL") ? err.message : "Unable to load dashboard statistics. Check DATABASE_URL and schema.sql." });
  }
}