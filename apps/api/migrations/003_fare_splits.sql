-- The real fare of a shared trip, entered by the person who booked the cab.
CREATE TABLE fare_splits (
  host_ride_id       uuid PRIMARY KEY REFERENCES rides(id) ON DELETE CASCADE,
  provider           text NOT NULL CHECK (provider IN ('uber', 'ola', 'rapido', 'indrive', 'other')),
  total              int NOT NULL CHECK (total > 0),
  booked_by_ride_id  uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  entered_by         uuid NOT NULL REFERENCES users(id),
  shares             jsonb NOT NULL,
  km                 jsonb NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Who owes whom, and whether it has been paid.
CREATE TABLE fare_payments (
  host_ride_id  uuid NOT NULL REFERENCES fare_splits(host_ride_id) ON DELETE CASCADE,
  from_ride_id  uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  to_ride_id    uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  amount        int NOT NULL CHECK (amount > 0),
  paid_at       timestamptz,
  PRIMARY KEY (host_ride_id, from_ride_id)
);
