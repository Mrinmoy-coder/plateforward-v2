import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
};
const reply = (res, code, body) => res.status(code).json(body);
const hashToken = (token) => typeof token === "string" && token.length >= 32
  ? createHash("sha256").update(token).digest("hex") : "";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const db = sql();
    if (req.method === "GET") {
      await db`UPDATE donations SET status='Expired', updated_at=now() WHERE status='Available' AND expiry_at <= now()`;
      const rows = await db`SELECT id,food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation,status,claimed_by,volunteer_name,created_at,updated_at FROM donations ORDER BY CASE WHEN status='Available' THEN 0 WHEN status='Claimed' THEN 1 ELSE 2 END, expiry_at ASC LIMIT 200`;
      return reply(res, 200, rows);
    }
    if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed." });
    const b = req.body || {};

    if (b.action === "create") {
      const required = ["food_name","category","quantity_kg","servings","expiry_at","pickup_address","donor_name","donor_organisation","owner_token"];
      if (required.some(k => b[k] == null || String(b[k]).trim() === "")) return reply(res, 400, { error: "Please complete all required fields." });
      const ownerHash = hashToken(b.owner_token);
      if (!ownerHash) return reply(res, 400, { error: "Could not establish donor ownership. Refresh and try again." });
      const kg = Number(b.quantity_kg), servings = Number(b.servings), expiry = new Date(b.expiry_at);
      if (!Number.isFinite(kg) || kg <= 0 || !Number.isInteger(servings) || servings < 1 || Number.isNaN(expiry.getTime()) || expiry <= new Date()) return reply(res, 400, { error: "Enter a valid quantity, servings and future expiry time." });
      const rows = await db`INSERT INTO donations (food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation,owner_token_hash) VALUES (${String(b.food_name).trim().slice(0,120)},${String(b.category).trim().slice(0,80)},${kg},${servings},${expiry.toISOString()},${String(b.pickup_address).trim().slice(0,250)},${String(b.notes||"").slice(0,500)},${String(b.donor_name).trim().slice(0,120)},${String(b.donor_organisation).trim().slice(0,120)},${ownerHash}) RETURNING id,food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation,status,claimed_by,volunteer_name,created_at,updated_at`;
      await db`INSERT INTO donation_events (donation_id,event_type,actor_name,details) VALUES (${rows[0].id},'Donation listed',${rows[0].donor_name},'New surplus food listing created')`;
      return reply(res, 201, rows[0]);
    }

    if (b.action === "claim") {
      const id = Number(b.id), claimant = String(b.actor_name || "").trim().slice(0,120);
      if (!Number.isInteger(id) || id < 1) return reply(res, 400, { error: "Invalid donation ID." });
      if (!claimant) return reply(res, 400, { error: "Enter the NGO or volunteer name to claim this donation." });
      const updated = await db`UPDATE donations SET status='Claimed',claimed_by=${claimant},updated_at=now() WHERE id=${id} AND status='Available' AND expiry_at > now() RETURNING id,food_name,status,claimed_by`;
      if (!updated.length) return reply(res, 409, { error: "This donation is no longer available. Refresh the page and try again." });
      await db`INSERT INTO donation_events (donation_id,event_type,actor_name,details) VALUES (${id},'Status changed to Claimed',${claimant},'NGO/volunteer plans to collect the food from the donor')`;
      return reply(res, 200, updated[0]);
    }

    if (b.action === "update") {
      const id = Number(b.id), next = String(b.status || ""), actor = String(b.actor_name || "").trim().slice(0,120), tokenHash = hashToken(String(b.permission_token || ""));
      if (!Number.isInteger(id) || id < 1) return reply(res, 400, { error: "Invalid donation ID." });
      if (!actor) return reply(res, 400, { error: "Enter your name to continue." });
      if (!tokenHash) return reply(res, 403, { error: "Only the original donor can confirm collection, using the browser where the donation was created." });
      const found = await db`SELECT id,status,owner_token_hash FROM donations WHERE id=${id}`;
      if (!found.length) return reply(res, 404, { error: "Donation not found." });
      const d = found[0], old = d.status;
      if (!d.owner_token_hash || tokenHash !== d.owner_token_hash) return reply(res, 403, { error: "Only the original donor who listed this food can confirm collection or cancel it." });
      let updated;
      if (next === "Delivered") {
        if (old !== "Claimed") return reply(res, 409, { error: "The donation must be claimed by an NGO before the donor can confirm collection." });
        updated = await db`UPDATE donations SET status='Delivered',volunteer_name=${actor},updated_at=now() WHERE id=${id} AND status='Claimed' AND owner_token_hash=${tokenHash} RETURNING id,status,claimed_by,volunteer_name`;
      } else if (next === "Cancelled") {
        if (old !== "Available") return reply(res, 409, { error: "Only an available, unclaimed donation can be cancelled." });
        updated = await db`UPDATE donations SET status='Cancelled',updated_at=now() WHERE id=${id} AND status='Available' AND owner_token_hash=${tokenHash} RETURNING id,status,claimed_by,volunteer_name`;
      } else {
        return reply(res, 403, { error: "This status change is not permitted. NGOs claim donations; only the original donor confirms collection." });
      }
      if (!updated || !updated.length) return reply(res, 409, { error: "This donation changed at the same time. Refresh and try again." });
      const detail = next === "Delivered" ? "Original donor confirmed that the NGO collected the food" : old + " -> " + next;
      await db`INSERT INTO donation_events (donation_id,event_type,actor_name,details) VALUES (${id},${next === "Delivered" ? "Collection confirmed by donor" : "Status changed to " + next},${actor},${detail})`;
      return reply(res, 200, updated[0]);
    }
    return reply(res, 400, { error: "Unknown action." });
  } catch (err) {
    console.error(err);
    const msg = String(err?.message || "");
    return reply(res, 500, { error: msg.includes("DATABASE_URL") ? msg : "Database request failed. Check DATABASE_URL and confirm the schema migration has been run." });
  }
}
