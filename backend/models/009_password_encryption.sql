-- =============================================
-- Password Hashing Migration
-- Uses existing password_hash column with pgcrypto bcrypt
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add hashed_password column for bcrypt
ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- Hash all existing plain-text passwords from password_hash column
UPDATE users 
SET hashed_password = crypt(password_hash, gen_salt('bf', 8))
WHERE password_hash IS NOT NULL AND hashed_password IS NULL;

-- Create trigger to auto-hash on insert/update
CREATE OR REPLACE FUNCTION hash_user_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.password_hash IS DISTINCT FROM OLD.password_hash) THEN
    NEW.hashed_password = crypt(NEW.password_hash, gen_salt('bf', 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hash_password ON users;
CREATE TRIGGER trg_hash_password
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION hash_user_password();

-- Secure login RPC function
CREATE OR REPLACE FUNCTION verify_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, user_name TEXT, user_role TEXT, user_department TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.role, u.department
  FROM users u
  WHERE (u.username = p_username OR u.email = p_username)
    AND u.hashed_password = crypt(p_password, u.hashed_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
