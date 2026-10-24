
-- PlateForward database schema (Neon PostgreSQL)
-- Safe to run on a new database or an existing database.

CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_kg NUMERIC(8,2) NOT NULL CHECK (quantity_kg > 0),
  servings INTEGER NOT NULL CHECK (servings > 0),
  expiry_at TIMESTAMPTZ NOT NULL,
  pickup_address TEXT NOT NULL,
  notes TEXT DEFAULT '',
  donor_name TEXT NOT NULL,
  donor_organisation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available'
    CHECK (
      status IN (
        'Available',
        'Claimed',
        'Picked up',
        'Delivered',
        'Expired',
        'Cancelled'
      )
    ),
  claimed_by TEXT,
  volunteer_name TEXT,
  owner_token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration for an existing database
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS owner_token_hash TEXT;

CREATE TABLE IF NOT EXISTS donation_events (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL
    REFERENCES donations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'Platform user',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS donations_status_expiry_idx
ON donations(status, expiry_at);

CREATE INDEX IF NOT EXISTS donation_events_donation_id_idx
ON donation_events(donation_id);
