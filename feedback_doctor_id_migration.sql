-- Run this once in the Supabase SQL Editor to enable doctor-linked feedback.
BEGIN;

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS doctor_id UUID
  REFERENCES public.doctors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS feedback_doctor_id_idx
  ON public.feedback(doctor_id);

DROP POLICY IF EXISTS "feedback: patient can insert own" ON public.feedback;
CREATE POLICY "feedback: patient can insert own" ON public.feedback
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    )
    AND doctor_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.appointments
      WHERE appointments.patient_id = feedback.patient_id
        AND appointments.doctor_id = feedback.doctor_id
        AND appointments.status IN ('pending', 'accepted', 'completed')
    )
  );

DROP POLICY IF EXISTS "feedback: doctor can read all" ON public.feedback;
DROP POLICY IF EXISTS "feedback: doctor can read own" ON public.feedback;
CREATE POLICY "feedback: doctor can read own" ON public.feedback
  FOR SELECT USING (doctor_id = auth.uid());

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
    RAISE EXCEPTION 'Feedback not found for this doctor';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_feedback_reviewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_feedback_reviewed(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
