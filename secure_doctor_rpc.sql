-- ============================================================
-- HEALTH-CONNECT: Secure Doctor Registration RPC
-- Run this in the Supabase SQL Editor to fix the security flaw.
-- ============================================================

-- 1. Create a secure table for invite codes
CREATE TABLE IF NOT EXISTS doctor_invite_codes (
    code TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT true
);

-- Insert your initial secure code (you can change this later directly in the DB)
INSERT INTO doctor_invite_codes (code) VALUES ('HC-2026-DOC') ON CONFLICT DO NOTHING;

-- Revoke public access to ensure nobody can read the codes
REVOKE ALL ON doctor_invite_codes FROM PUBLIC;

-- 2. Create the RPC function that runs with elevated privileges (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION register_doctor_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_specialization TEXT,
    p_phone TEXT,
    p_hospital_name TEXT,
    p_hospital_address TEXT,
    p_invite_code TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    valid_code boolean;
BEGIN
    -- Check if invite code is valid
    SELECT EXISTS(
        SELECT 1 FROM doctor_invite_codes 
        WHERE code = p_invite_code AND is_active = true
    ) INTO valid_code;
    
    IF NOT valid_code THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;

    -- Insert into doctors table securely
    INSERT INTO doctors (id, full_name, email, specialization, phone, hospital_name, hospital_address)
    VALUES (p_user_id, p_full_name, p_email, p_specialization, p_phone, p_hospital_name, p_hospital_address);

    RETURN true;
END;
$$;

-- 3. DROP the insecure client-side insert policy
DROP POLICY IF EXISTS "doctors: doctor can insert own" ON doctors;
