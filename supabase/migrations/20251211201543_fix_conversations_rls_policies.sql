/*
  # Fix RLS Policies for Public Access

  1. Changes
    - Drop existing restrictive RLS policies
    - Add new policies that allow public access without authentication
    - This enables the voice agent demo to work without requiring user authentication
  
  2. Security Note
    - These policies allow any user to create and access conversations
    - Suitable for demo/development environments
    - For production, implement proper authentication
*/

-- Drop existing restrictive policies for conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Drop existing restrictive policies for messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

-- Create new public access policies for conversations
CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON conversations FOR DELETE
  USING (true);

-- Create new public access policies for messages
CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete messages"
  ON messages FOR DELETE
  USING (true);
