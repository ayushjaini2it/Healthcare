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
DROP POLICY IF EXISTS "patients: patient can read own" ON patients;
CREATE POLICY "patients: patient can read own" ON patients
  FOR SELECT USING (auth.uid() = auth_user_id);

-- A patient can only update their own record
DROP POLICY IF EXISTS "patients: patient can update own" ON patients;
CREATE POLICY "patients: patient can update own" ON patients
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- A patient can only insert their own record
DROP POLICY IF EXISTS "patients: patient can insert own" ON patients;
CREATE POLICY "patients: patient can insert own" ON patients
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- A doctor can read ALL patients
DROP POLICY IF EXISTS "patients: doctor can read all" ON patients;
CREATE POLICY "patients: doctor can read all" ON patients
  FOR SELECT USING (is_doctor());

-- A doctor can update any patient's record (status changes, etc.)
DROP POLICY IF EXISTS "patients: doctor can update any" ON patients;
CREATE POLICY "patients: doctor can update any" ON patients
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- DOCTORS TABLE
-- ============================================================

-- Any authenticated user can read doctor profiles (for appointment booking)
DROP POLICY IF EXISTS "doctors: any authenticated can read" ON doctors;
CREATE POLICY "doctors: any authenticated can read" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

-- A doctor can only update their own profile
DROP POLICY IF EXISTS "doctors: doctor can update own" ON doctors;
CREATE POLICY "doctors: doctor can update own" ON doctors
  FOR UPDATE USING (auth.uid() = id);

-- A doctor can insert their own record (during signup)
DROP POLICY IF EXISTS "doctors: doctor can insert own" ON doctors;
CREATE POLICY "doctors: doctor can insert own" ON doctors
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- CONSULTATIONS TABLE
-- ============================================================

-- A patient can only see consultations for their own patient record
DROP POLICY IF EXISTS "consultations: patient can read own" ON consultations;
CREATE POLICY "consultations: patient can read own" ON consultations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can read all consultations
DROP POLICY IF EXISTS "consultations: doctor can read all" ON consultations;
CREATE POLICY "consultations: doctor can read all" ON consultations
  FOR SELECT USING (is_doctor());

-- Only a doctor can create a consultation
DROP POLICY IF EXISTS "consultations: doctor can insert" ON consultations;
CREATE POLICY "consultations: doctor can insert" ON consultations
  FOR INSERT WITH CHECK (is_doctor());

-- Only a doctor can update consultations
DROP POLICY IF EXISTS "consultations: doctor can update" ON consultations;
CREATE POLICY "consultations: doctor can update" ON consultations
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- DIAGNOSES TABLE
-- ============================================================

-- A patient can only see their own diagnoses
DROP POLICY IF EXISTS "diagnoses: patient can read own" ON diagnoses;
CREATE POLICY "diagnoses: patient can read own" ON diagnoses
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can read all diagnoses
DROP POLICY IF EXISTS "diagnoses: doctor can read all" ON diagnoses;
CREATE POLICY "diagnoses: doctor can read all" ON diagnoses
  FOR SELECT USING (is_doctor());

-- Only a doctor can create or update diagnoses
DROP POLICY IF EXISTS "diagnoses: doctor can insert" ON diagnoses;
CREATE POLICY "diagnoses: doctor can insert" ON diagnoses
  FOR INSERT WITH CHECK (is_doctor());

DROP POLICY IF EXISTS "diagnoses: doctor can update" ON diagnoses;
CREATE POLICY "diagnoses: doctor can update" ON diagnoses
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- TREATMENTS TABLE
-- ============================================================

DROP POLICY IF EXISTS "treatments: patient can read own" ON treatments;
CREATE POLICY "treatments: patient can read own" ON treatments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "treatments: doctor can read all" ON treatments;
CREATE POLICY "treatments: doctor can read all" ON treatments
  FOR SELECT USING (is_doctor());

DROP POLICY IF EXISTS "treatments: doctor can insert" ON treatments;
CREATE POLICY "treatments: doctor can insert" ON treatments
  FOR INSERT WITH CHECK (is_doctor());

DROP POLICY IF EXISTS "treatments: doctor can update" ON treatments;
CREATE POLICY "treatments: doctor can update" ON treatments
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- MEDICATIONS TABLE
-- ============================================================

-- A patient can read medications linked to their treatments
DROP POLICY IF EXISTS "medications: patient can read own" ON medications;
CREATE POLICY "medications: patient can read own" ON medications
  FOR SELECT USING (
    treatment_id IN (
      SELECT id FROM treatments
      WHERE patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "medications: doctor can read all" ON medications;
CREATE POLICY "medications: doctor can read all" ON medications
  FOR SELECT USING (is_doctor());

DROP POLICY IF EXISTS "medications: doctor can insert" ON medications;
CREATE POLICY "medications: doctor can insert" ON medications
  FOR INSERT WITH CHECK (is_doctor());

DROP POLICY IF EXISTS "medications: doctor can update" ON medications;
CREATE POLICY "medications: doctor can update" ON medications
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- BILLS TABLE
-- ============================================================

DROP POLICY IF EXISTS "bills: patient can read own" ON bills;
CREATE POLICY "bills: patient can read own" ON bills
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "bills: doctor can read all" ON bills;
CREATE POLICY "bills: doctor can read all" ON bills
  FOR SELECT USING (is_doctor());

DROP POLICY IF EXISTS "bills: doctor can insert" ON bills;
CREATE POLICY "bills: doctor can insert" ON bills
  FOR INSERT WITH CHECK (is_doctor());

DROP POLICY IF EXISTS "bills: doctor can update" ON bills;
CREATE POLICY "bills: doctor can update" ON bills
  FOR UPDATE USING (is_doctor());


-- ============================================================
-- BILLING_ITEMS TABLE
-- ============================================================

-- A patient can read their own billing items (via bill_id)
DROP POLICY IF EXISTS "billing_items: patient can read own" ON billing_items;
CREATE POLICY "billing_items: patient can read own" ON billing_items
  FOR SELECT USING (
    bill_id IN (
      SELECT id FROM bills
      WHERE patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "billing_items: doctor can read all" ON billing_items;
CREATE POLICY "billing_items: doctor can read all" ON billing_items
  FOR SELECT USING (is_doctor());

DROP POLICY IF EXISTS "billing_items: doctor can insert" ON billing_items;
CREATE POLICY "billing_items: doctor can insert" ON billing_items
  FOR INSERT WITH CHECK (is_doctor());


-- ============================================================
-- FEEDBACK TABLE
-- ============================================================

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS doctor_id UUID
  REFERENCES doctors(id) ON DELETE SET NULL;

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;

UPDATE feedback
SET would_recommend = COALESCE(rating >= 4, FALSE)
WHERE would_recommend IS NULL;

ALTER TABLE feedback
  ALTER COLUMN would_recommend SET DEFAULT FALSE,
  ALTER COLUMN would_recommend SET NOT NULL;

-- A patient can read their own feedback
DROP POLICY IF EXISTS "feedback: patient can read own" ON feedback;
CREATE POLICY "feedback: patient can read own" ON feedback
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A patient can submit feedback for a doctor they booked
DROP POLICY IF EXISTS "feedback: patient can insert own" ON feedback;
CREATE POLICY "feedback: patient can insert own" ON feedback
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND doctor_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.patient_id = feedback.patient_id
        AND appointments.doctor_id = feedback.doctor_id
        AND appointments.status IN ('pending', 'accepted', 'completed')
    )
  );

-- A doctor can read only feedback addressed to them
DROP POLICY IF EXISTS "feedback: doctor can read all" ON feedback;
DROP POLICY IF EXISTS "feedback: doctor can read own" ON feedback;
CREATE POLICY "feedback: doctor can read own" ON feedback
  FOR SELECT USING (doctor_id = auth.uid());

-- Allow doctors to change only the review status, not feedback content.
CREATE OR REPLACE FUNCTION public.mark_feedback_reviewed(feedback_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_doctor() THEN
    RAISE EXCEPTION 'Only doctors may review feedback';
  END IF;

  UPDATE public.feedback
  SET status = 'reviewed'
  WHERE id = feedback_id
    AND doctor_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_feedback_reviewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_feedback_reviewed(uuid) TO authenticated;


-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================

-- A patient can see their own appointments
DROP POLICY IF EXISTS "appointments: patient can read own" ON appointments;
CREATE POLICY "appointments: patient can read own" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A patient can book an appointment (INSERT) for their own patient record
DROP POLICY IF EXISTS "appointments: patient can insert" ON appointments;
CREATE POLICY "appointments: patient can insert" ON appointments
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
  );

-- A doctor can see appointments assigned to them
DROP POLICY IF EXISTS "appointments: doctor can read own" ON appointments;
CREATE POLICY "appointments: doctor can read own" ON appointments
  FOR SELECT USING (doctor_id = auth.uid());

-- A doctor can only update appointments assigned to them (accept/reject)
DROP POLICY IF EXISTS "appointments: doctor can update own" ON appointments;
CREATE POLICY "appointments: doctor can update own" ON appointments
  FOR UPDATE USING (doctor_id = auth.uid());

-- Enable realtime delivery for new appointment requests to the assigned doctor.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'appointments'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;


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
-- STEP 4: Create account profiles at signup
-- Authenticated users may not have a session until email confirmation, so
-- profile creation must run inside the trusted auth.users insert trigger.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT := NEW.raw_user_meta_data ->> 'role';
  full_name TEXT := BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
BEGIN
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (
      auth_user_id, first_name, last_name, email, age, gender, phone, address, status
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'Unknown'),
      COALESCE(
        CASE
          WHEN POSITION(' ' IN full_name) > 0
            THEN NULLIF(BTRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)), '')
          ELSE NULL
        END,
        ''
      ),
      NEW.email,
      NULLIF(NEW.raw_user_meta_data ->> 'age', '')::INTEGER,
      COALESCE(NEW.raw_user_meta_data ->> 'gender', 'other'),
      '',
      '',
      'registered'
    );
  ELSIF user_role = 'doctor' THEN
    INSERT INTO public.doctors (
      id, full_name, email, specialization, phone, hospital_name, hospital_address
    )
    VALUES (
      NEW.id,
      full_name,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'specialization', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'hospital_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'hospital_address', '')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done! RLS policies and account profile signup trigger are active.
-- ============================================================
