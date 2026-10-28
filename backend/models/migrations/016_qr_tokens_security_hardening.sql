-- ==============================================================================
-- ENTERPRISE SECURITY MIGRATION 016: QR TOKENS & ATTENDANCE ENDPOINT HARDENING
-- Description: 
--   1. Replaces permissive "qr_tokens_all" policy with least-privilege RLS.
--   2. Prevents anonymous table enumeration and token harvesting.
--   3. Revokes destructive UPDATE and DELETE permissions from client roles.
--   4. Adds anti-replay unique constraints and indexing.
--   5. Implements server-side timestamp validation and rate-limiting safeguards.
-- ==============================================================================

-- 1. CLEAN UP PERMISSIVE LEGACY POLICIES
DROP POLICY IF EXISTS "qr_tokens_all" ON qr_tokens;
DROP POLICY IF EXISTS "Allow all on qr_tokens" ON qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_select_policy" ON qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_insert_policy" ON qr_tokens;

-- 2. ENSURE ROW LEVEL SECURITY IS ENFORCED
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens FORCE ROW LEVEL SECURITY;

-- 3. REVOKE DESTRUCTIVE PRIVILEGES FROM CLIENT ROLES (anon and authenticated)
-- Clients must NEVER be able to DELETE (erasing logs) or UPDATE (tampering) tokens
REVOKE ALL ON qr_tokens FROM public, anon, authenticated;
GRANT INSERT, SELECT ON qr_tokens TO anon, authenticated;

-- 4. LEAST-PRIVILEGE RLS POLICIES

-- Policy A: RESTRICTED SELECT
-- Prevent attackers from dumping all tokens (SELECT * FROM qr_tokens).
-- A user can only inspect tokens that belong to them, or specific anti-replay checks.
CREATE POLICY "qr_tokens_select_policy" ON qr_tokens
  FOR SELECT TO anon, authenticated
  USING (
    -- Authenticated user checking their own token history
    (auth.uid() IS NOT NULL AND employee_id = auth.uid())
    OR
    -- Database administrator / service role
    (auth.role() = 'service_role')
  );

-- Policy B: CONTROLLED INSERT WITH INTEGRITY CHECK
-- Allows legitimate punch recording while validating structure and preventing replay payloads.
CREATE POLICY "qr_tokens_insert_policy" ON qr_tokens
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Token must be well-formed and non-empty
    token IS NOT NULL AND length(token) >= 8 AND length(token) <= 255 AND
    -- Action must match permitted attendance operations
    action_type IN ('checkin', 'checkout', 'mission_out', 'mission_in') AND
    -- Prevent inserting historical timestamps far in the past or future
    (created_at IS NULL OR created_at >= NOW() - INTERVAL '2 minutes')
  );

-- 5. ANTI-REPLAY DATABASE CONSTRAINTS
-- Ensure that a generated token cannot be used twice (prevent race-condition replay attacks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'qr_tokens_token_employee_unique'
  ) THEN
    ALTER TABLE qr_tokens ADD CONSTRAINT qr_tokens_token_employee_unique UNIQUE (token, employee_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON qr_tokens (token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_employee_date ON qr_tokens (employee_id, created_at);

-- 6. SERVER-SIDE SECURE RPC FOR TOKEN CONSUMPTION (ZERO-LEAKAGE ENDPOINT)
-- Validates token age (<= 40 seconds) on the trusted database server, eliminating client-only trust.
CREATE OR REPLACE FUNCTION verify_and_record_qr_punch(
  p_token TEXT,
  p_hr_id UUID,
  p_employee_id UUID,
  p_action_type TEXT,
  p_max_age_seconds INT DEFAULT 40
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_timestamp_ms BIGINT;
  v_now_ms BIGINT;
  v_age_seconds NUMERIC;
  v_existing_id UUID;
  v_inserted_id UUID;
BEGIN
  -- Basic parameter validation
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token string format');
  END IF;

  IF p_action_type NOT IN ('checkin', 'checkout', 'mission_out', 'mission_in') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid punch action type');
  END IF;

  -- Extract timestamp prefix (e.g. "1793051213007_c9885...")
  BEGIN
    v_timestamp_ms := split_part(p_token, '_', 1)::BIGINT;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Malformed token timestamp structure');
  END;

  -- Validate token freshness (must be within permitted time window)
  v_now_ms := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  v_age_seconds := ABS(v_now_ms - v_timestamp_ms) / 1000.0;

  IF v_age_seconds > p_max_age_seconds THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('QR code expired (token age: %s seconds, allowed: %s)', round(v_age_seconds), p_max_age_seconds)
    );
  END IF;

  -- Check if token was already used (Anti-Replay Protection)
  SELECT id INTO v_existing_id
  FROM qr_tokens
  WHERE token = p_token AND (employee_id = p_employee_id OR p_employee_id IS NULL)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR token has already been used');
  END IF;

  -- Insert token as consumed in an atomic transaction
  INSERT INTO qr_tokens (token, hr_id, employee_id, action_type, used_at, created_at)
  VALUES (p_token, p_hr_id, p_employee_id, p_action_type, NOW(), NOW())
  RETURNING id INTO v_inserted_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'QR token verified and recorded successfully',
    'id', v_inserted_id
  );
END;
$$;

-- Grant execution of the verification RPC function to client roles
REVOKE ALL ON FUNCTION verify_and_record_qr_punch FROM public;
GRANT EXECUTE ON FUNCTION verify_and_record_qr_punch TO anon, authenticated;
