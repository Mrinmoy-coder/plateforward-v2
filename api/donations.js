import { neon } from "@neondatabase/serverless";

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
};
const reply = (res, code, body) => res.status(code).json(body);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const db = sql();
    if (req.method === "GET") {
      await db`UPDATE donations SET status='Expired', updated_at=now() WHERE status='Available' AND expiry_at <= now()`;
      const rows = await db`SELECT * FROM donations ORDER BY CASE WHEN status='Available' THEN 0 WHEN status='Claimed' THEN 1 ELSE 2 END, expiry_at ASC LIMIT 200`;
      return reply(res, 200, rows);
    }
    if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed." });

    const b = req.body || {};
    if (b.action === "create") {
      const required = ["food_name","category","quantity_kg","servings","expiry_at","pickup_address","donor_name","donor_organisation"];
      if (required.some(k => b[k] == null || String(b[k]).trim() === "")) return reply(res, 400, { error: "Please complete all required fields." });
      const kg = Number(b.quantity_kg), servings = Number(b.servings), expiry = new Date(b.expiry_at);
      if (!Number.isFinite(kg) || kg <= 0 || !Number.isInteger(servings) || servings < 1 || Number.isNaN(expiry.getTime()) || expiry <= new Date()) return reply(res, 400, { error: "Enter a valid quantity, servings and future expiry time." });
      const rows = await db`
        INSERT INTO donations (food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation)
        VALUES (${String(b.food_name).trim().slice(0,120)},${String(b.category).slice(0,80)},${kg},${servings},${expiry.toISOString()},${String(b.pickup_address).trim().slice(0,250)},${String(b.notes||"").slice(0,500)},${String(b.donor_name).trim().slice(0,120)},${String(b.donor_organisation).trim().slice(0,120)})
        RETURNING *`;
      await db`INSERT INTO donation_events (donation_id,event_type,actor_name,details) VALUES (${rows[0].id},'Donation listed',${rows[0].donor_name},'New surplus food listing created')`;
      return reply(res, 201, rows[0]);
    }
    if (b.action === "update") {
      const id = Number(b.id), next = String(b.status || ""), actor = String(b.actor_name || "Platform user").slice(0,120), volunteer = String(b.volunteer_name || "").slice(0,120);
      if (!Number.isInteger(id) || id < 1) return reply(res, 400, { error: "Invalid donation ID." });
      const found = await db`SELECT id,status FROM donations WHERE id=${id}`;
      if (!found.length) return reply(res, 404, { error: "Donation not found." });
      const allowed = { "Available":["Claimed","Cancelled"], "Claimed":["Picked up","Cancelled"], "Picked up":["Delivered"], "Delivered":[], "Expired":[], "Cancelled":[] };
      const old = found[0].status;
      if (!allowed[old]?.includes(next)) return reply(res, 409, { error: "This status change is not allowed. Refresh and try again." });
      const updated = await db`
        UPDATE donations SET status=${next},
          claimed_by=CASE WHEN ${next}='Claimed' THEN ${actor} ELSE claimed_by END,
          volunteer_name=CASE WHEN ${next} IN ('Picked up','Delivered') AND ${volunteer}<>'' THEN ${volunteer} ELSE volunteer_name END,
          updated_at=now()
        WHERE id=${id} AND status=${old} RETURNING *`;
      if (!updated.length) return reply(res, 409, { error: "Donation changed at the same time. Refresh and try again." });
      await db`INSERT INTO donation_events (donation_id,event_type,actor_name,details) VALUES (${id},${"Status changed to " + next},${actor},${old + " -> " + next})`;
      return reply(res, 200, updated[0]);
    }
    return reply(res, 400, { error: "Unknown action." });
  } catch (err) {
    console.error(err);
    return reply(res, 500, { error: err.message?.includes("DATABASE_URL") ? err.message : "Database request failed. Check DATABASE_URL and run schema.sql." });
  }
}