-- ============================================================
-- Health-Connect — Row Level Security (RLS) Policy Setup
-- ============================================================
-- Run this entire script in the Supabase SQL Editor.
-- This is the most critical security step for your application.
-- ============================================================


-- ============================================================
-- STEP 1: Enable RLS on ALL tables
-- ============================================================
ALTER TABLE patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 2: Helper function — checks if the current user is a doctor
-- ============================================================
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM doctors WHERE id = auth.uid()
  );
$$;


-- ============================================================
-- PATIENTS TABLE
-- ============================================================

-- A patient can only read their own record
CREATE POLICY "patients: patient can read own" ON patients
  FOR SELECT USING (auth.uid() = auth_user_id);

-- A patient can only update their own record
CREATE POLICY "patients: patient can update own" ON patients
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- A patient can only insert their own record
CREATE POLICY "patients: patient can insert own" ON patients
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- A doctor can read ALL patients
CREATE POLICY "patients: doctor can read all" ON patients
  FOR SELECT USING (is_doctor());

-- A doctor can update any patient's record (status changes, etc.)
CREATE POLICY "patients: doctor can update any" ON patients
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- DOCTORS TABLE
-- ============================================================

-- Any authenticated user can read doctor profiles (for appointment booking)
CREATE POLICY "doctors: any authenticated can read" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

-- A doctor can only update their own profile
CREATE POLICY "doctors: doctor can update own" ON doctors
  FOR UPDATE USING (auth.uid() = id);

-- A doctor can insert their own record (during signup)
CREATE POLICY "doctors: doctor can insert own" ON doctors
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- CONSULTATIONS TABLE
-- ============================================================

-- A patient can only see consultations for their own patient record
CREATE POLICY "consultations: patient can read own" ON consultations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can read all consultations
CREATE POLICY "consultations: doctor can read all" ON consultations
  FOR SELECT USING (is_doctor());

-- Only a doctor can create a consultation
CREATE POLICY "consultations: doctor can insert" ON consultations
  FOR INSERT WITH CHECK (is_doctor());

-- Only a doctor can update consultations
CREATE POLICY "consultations: doctor can update" ON consultations
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- DIAGNOSES TABLE
-- ============================================================

-- A patient can only see their own diagnoses
CREATE POLICY "diagnoses: patient can read own" ON diagnoses
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can read all diagnoses
CREATE POLICY "diagnoses: doctor can read all" ON diagnoses
  FOR SELECT USING (is_doctor());

-- Only a doctor can create or update diagnoses
CREATE POLICY "diagnoses: doctor can insert" ON diagnoses
  FOR INSERT WITH CHECK (is_doctor());

CREATE POLICY "diagnoses: doctor can update" ON diagnoses
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- TREATMENTS TABLE
-- ============================================================

CREATE POLICY "treatments: patient can read own" ON treatments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "treatments: doctor can read all" ON treatments
  FOR SELECT USING (is_doctor());

CREATE POLICY "treatments: doctor can insert" ON treatments
  FOR INSERT WITH CHECK (is_doctor());

CREATE POLICY "treatments: doctor can update" ON treatments
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- MEDICATIONS TABLE
-- ============================================================

-- A patient can read medications linked to their treatments
CREATE POLICY "medications: patient can read own" ON medications
  FOR SELECT USING (
    treatment_id IN (
      SELECT id FROM treatments
      WHERE patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "medications: doctor can read all" ON medications
  FOR SELECT USING (is_doctor());

CREATE POLICY "medications: doctor can insert" ON medications
  FOR INSERT WITH CHECK (is_doctor());

CREATE POLICY "medications: doctor can update" ON medications
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- BILLS TABLE
-- ============================================================

CREATE POLICY "bills: patient can read own" ON bills
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "bills: doctor can read all" ON bills
  FOR SELECT USING (is_doctor());

CREATE POLICY "bills: doctor can insert" ON bills
  FOR INSERT WITH CHECK (is_doctor());

CREATE POLICY "bills: doctor can update" ON bills
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- BILLING_ITEMS TABLE
-- ============================================================

-- A patient can read their own billing items (via bill_id)
CREATE POLICY "billing_items: patient can read own" ON billing_items
  FOR SELECT USING (
    bill_id IN (
      SELECT id FROM bills
      WHERE patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "billing_items: doctor can read all" ON billing_items
  FOR SELECT USING (is_doctor());

CREATE POLICY "billing_items: doctor can insert" ON billing_items
  FOR INSERT WITH CHECK (is_doctor());


-- ============================================================
-- FEEDBACK TABLE
-- ============================================================

-- A patient can read their own feedback
CREATE POLICY "feedback: patient can read own" ON feedback
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A patient can submit feedback for their own patient record
CREATE POLICY "feedback: patient can insert own" ON feedback
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can read all feedback
CREATE POLICY "feedback: doctor can read all" ON feedback
  FOR SELECT USING (is_doctor());


-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================

-- A patient can see their own appointments
CREATE POLICY "appointments: patient can read own" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A patient can book an appointment (INSERT) for their own patient record
CREATE POLICY "appointments: patient can insert" ON appointments
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can see appointments assigned to them
CREATE POLICY "appointments: doctor can read own" ON appointments
  FOR SELECT USING (doctor_id = auth.uid());

-- A doctor can only update appointments assigned to them (accept/reject)
CREATE POLICY "appointments: doctor can update own" ON appointments
  FOR UPDATE USING (doctor_id = auth.uid());


-- ============================================================
-- STEP 3: Foreign key constraint on doctors table (Step 7 of plan)
-- Ensures every doctor row is backed by a real auth user.
-- Skipped safely if the constraint already exists.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doctors_id_fkey'
    AND conrelid = 'doctors'::regclass
  ) THEN
    ALTER TABLE doctors
      ADD CONSTRAINT doctors_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;


-- ============================================================
-- Done! All RLS policies are now active.
-- ============================================================
