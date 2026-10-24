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
    CHECK (status IN ('Available','Claimed','Picked up','Delivered','Expired','Cancelled')),
  claimed_by TEXT,
  volunteer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS donation_events (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'Platform user',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS donations_status_expiry_idx ON donations(status, expiry_at);
CREATE INDEX IF NOT EXISTS donation_events_donation_id_idx ON donation_events(donation_id);

-- Optional demo data. Run only once, after the tables are created.
INSERT INTO donations (food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation,status)
SELECT 'Fresh vegetable pulao','Prepared meals',18.50,65,now()+interval '5 hours','Salt Lake Sector V, Kolkata','Packed in food-grade containers. Keep covered.','Ananya Sen','Green Leaf Kitchen','Available'
WHERE NOT EXISTS (SELECT 1 FROM donations);
INSERT INTO donations (food_name,category,quantity_kg,servings,expiry_at,pickup_address,notes,donor_name,donor_organisation,status)
SELECT 'Seasonal fruit boxes','Fruits & vegetables',12.00,40,now()+interval '8 hours','College More, Salt Lake, Kolkata','Fresh apples, bananas and oranges.','Rohan Das','Harvest Table','Available'
WHERE (SELECT COUNT(*) FROM donations)=1;
INSERT INTO donation_events (donation_id,event_type,actor_name,details)
SELECT id,'Donation listed',donor_name,'Sample donation loaded for demonstration'
FROM donations d WHERE NOT EXISTS (SELECT 1 FROM donation_events e WHERE e.donation_id=d.id);
