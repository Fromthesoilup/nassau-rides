-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Public driver profiles" ON drivers;
DROP POLICY IF EXISTS "Public tour guide profiles" ON tour_guides;
DROP POLICY IF EXISTS "Users can view own rides" ON rides;
DROP POLICY IF EXISTS "Attractions are public" ON attractions;

-- Create new RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id);

-- Create new RLS policies for drivers table
CREATE POLICY "Public driver profiles" ON drivers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Drivers can create their profile" ON drivers
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

CREATE POLICY "Drivers can update their profile" ON drivers
  FOR UPDATE USING (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  ) WITH CHECK (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

-- Create new RLS policies for tour_guides table
CREATE POLICY "Public tour guide profiles" ON tour_guides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tour guides can create their profile" ON tour_guides
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

CREATE POLICY "Tour guides can update their profile" ON tour_guides
  FOR UPDATE USING (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  ) WITH CHECK (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

-- Create new RLS policies for rides table
CREATE POLICY "Users can view own rides" ON rides
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id) OR 
                     auth.uid() = (SELECT auth_id FROM users WHERE id = (SELECT user_id FROM drivers WHERE id = driver_id)));

CREATE POLICY "Users can create rides" ON rides
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT auth_id FROM users WHERE id = tourist_id)
  );

-- Create new RLS policy for attractions table
CREATE POLICY "Attractions are public" ON attractions
  FOR SELECT USING (true);
