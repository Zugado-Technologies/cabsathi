CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        text NOT NULL UNIQUE,
  name         text,
  gender       text CHECK (gender IN ('male', 'female', 'other')),
  birth_year   int,
  rating       numeric(2,1) NOT NULL DEFAULT 5.0,
  rides_count  int NOT NULL DEFAULT 0,
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
  phone       text PRIMARY KEY,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int NOT NULL DEFAULT 0
);

CREATE TABLE rides (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_name     text NOT NULL,
  from_point    geography(Point, 4326) NOT NULL,
  to_name       text NOT NULL,
  to_point      geography(Point, 4326) NOT NULL,
  depart_at     timestamptz NOT NULL,
  seats         int NOT NULL CHECK (seats BETWEEN 1 AND 3),
  gender_pref   text NOT NULL CHECK (gender_pref IN ('any', 'same')),
  distance_km   numeric(6,2) NOT NULL,
  duration_min  int NOT NULL,
  solo_fare     int NOT NULL,
  status        text NOT NULL DEFAULT 'published'
                CHECK (status IN ('published', 'matched', 'cancelled', 'completed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rides_from_gix ON rides USING gist (from_point);
CREATE INDEX rides_to_gix ON rides USING gist (to_point);
CREATE INDEX rides_depart_idx ON rides (status, depart_at);

-- A request from one person's ride to another person's ride.
CREATE TABLE ride_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_ride_id  uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  to_ride_id    uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_ride_id, to_ride_id)
);
