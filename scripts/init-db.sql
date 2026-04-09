-- Nassau Rides Database Schema
-- Run this in your Supabase SQL Editor

-- =====================
-- ENUMS
-- =====================
CREATE TYPE user_role AS ENUM ('tourist', 'driver', 'tour_guide');
CREATE TYPE ride_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE tour_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- =====================
-- TABLES
-- =====================

-- Users table (all roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'tourist',
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver profiles
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT,
  vehicle_type TEXT NOT NULL,
  vehicle_color TEXT,
  license_plate TEXT NOT NULL UNIQUE,
  insurance_expiry DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_rides INT DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tour guides
CREATE TABLE tour_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specializations TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_tours INT DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rides
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status ride_status DEFAULT 'pending',
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  pickup_address TEXT,
  dropoff_latitude DECIMAL(10, 8),
  dropoff_longitude DECIMAL(11, 8),
  dropoff_address TEXT,
  estimated_distance DECIMAL(8, 2),
  estimated_fare DECIMAL(10, 2),
  actual_fare DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tours
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tour_guide_id UUID REFERENCES tour_guides(id) ON DELETE SET NULL,
  status tour_status DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration INT,
  estimated_total_cost DECIMAL(10, 2),
  actual_total_cost DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tour stops
CREATE TABLE tour_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_minutes INT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2),
  driver_or_guide_amount DECIMAL(10, 2),
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attractions (pre-seeded)
CREATE TABLE attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  image_url TEXT,
  price_per_visit DECIMAL(10, 2) DEFAULT 0,
  duration_minutes INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_active ON drivers(is_active);
CREATE INDEX idx_tour_guides_user_id ON tour_guides(user_id);
CREATE INDEX idx_tour_guides_active ON tour_guides(is_active);
CREATE INDEX idx_rides_tourist_id ON rides(tourist_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_tours_tourist_id ON tours(tourist_id);
CREATE INDEX idx_tours_guide_id ON tours(tour_guide_id);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tour_stops_tour_id ON tour_stops(tour_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_attractions_category ON attractions(category);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Drivers policies
CREATE POLICY "Anyone can view active drivers" ON drivers FOR SELECT USING (is_active = true OR auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Drivers can insert own profile" ON drivers FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Tour guides policies
CREATE POLICY "Anyone can view active guides" ON tour_guides FOR SELECT USING (is_active = true OR auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Guides can insert own profile" ON tour_guides FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Guides can update own profile" ON tour_guides FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Rides policies
CREATE POLICY "Users can view own rides" ON rides FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id)
  OR auth.uid() = (SELECT u.auth_id FROM users u JOIN drivers d ON d.user_id = u.id WHERE d.id = driver_id)
);
CREATE POLICY "Tourists can create rides" ON rides FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id));
CREATE POLICY "Drivers can update rides" ON rides FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id)
  OR auth.uid() = (SELECT u.auth_id FROM users u JOIN drivers d ON d.user_id = u.id WHERE d.id = driver_id)
);

-- Tours policies
CREATE POLICY "Users can view own tours" ON tours FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id)
  OR auth.uid() = (SELECT u.auth_id FROM users u JOIN tour_guides g ON g.user_id = u.id WHERE g.id = tour_guide_id)
);
CREATE POLICY "Tourists can create tours" ON tours FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id));
CREATE POLICY "Users can update own tours" ON tours FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id)
  OR auth.uid() = (SELECT u.auth_id FROM users u JOIN tour_guides g ON g.user_id = u.id WHERE g.id = tour_guide_id)
);

-- Tour stops policies
CREATE POLICY "Users can view tour stops" ON tour_stops FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tours t
    WHERE t.id = tour_id
    AND (
      auth.uid() = (SELECT auth_id FROM users WHERE id = t.tourist_id)
      OR auth.uid() = (SELECT u.auth_id FROM users u JOIN tour_guides g ON g.user_id = u.id WHERE g.id = t.tour_guide_id)
    )
  )
);
CREATE POLICY "Tourists can insert tour stops" ON tour_stops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_id AND auth.uid() = (SELECT auth_id FROM users WHERE id = t.tourist_id))
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Reviews policies
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = reviewer_id));

-- Attractions - fully public read
CREATE POLICY "Attractions are public" ON attractions FOR SELECT USING (true);

-- =====================
-- SEED ATTRACTIONS
-- =====================
INSERT INTO attractions (name, description, category, latitude, longitude, price_per_visit, duration_minutes) VALUES
  ('Atlantis Resort', 'Iconic resort with water park, aquarium and casino on Paradise Island', 'beach', 25.0866, -77.3245, 25.00, 90),
  ('Cable Beach', 'Beautiful 3-mile sandy beach with water sports and restaurants', 'beach', 25.0780, -77.3607, 15.00, 60),
  ('Junkanoo Beach', 'Popular beach near downtown Nassau with local food vendors', 'beach', 25.0782, -77.3422, 10.00, 45),
  ('Fort Fincastle', 'Historic 18th-century fort with panoramic views of Nassau', 'historic', 25.0772, -77.3362, 20.00, 45),
  ('Queen''s Staircase', '65 steps carved from limestone, built by enslaved people in the 1790s', 'historic', 25.0764, -77.3362, 0.00, 30),
  ('Blue Lagoon Island', 'Private island with dolphin encounters, sea lion shows and white sand beaches', 'water_sports', 25.0954, -77.2869, 50.00, 180),
  ('The Straw Market', 'Famous downtown market for authentic Bahamian crafts and souvenirs', 'shopping', 25.0781, -77.3454, 0.00, 45),
  ('Nassau Botanical Gardens', '18-acre tropical garden with over 600 plant species', 'historic', 25.0631, -77.3547, 12.00, 60),
  ('Pirates of Nassau Museum', 'Interactive museum bringing the golden age of piracy to life', 'historic', 25.0783, -77.3461, 15.00, 60),
  ('Adastra Gardens', 'Home to the famous marching flamingos, peacocks and macaws', 'historic', 25.0650, -77.3430, 18.00, 45),
  ('Clifton Heritage National Park', 'Scenic coastal park with caves, ruins and snorkeling spots', 'water_sports', 25.0100, -77.5400, 10.00, 90),
  ('Fish Fry at Arawak Cay', 'Local food destination with fresh seafood, conch salad and live music', 'dining', 25.0794, -77.3563, 0.00, 60);
