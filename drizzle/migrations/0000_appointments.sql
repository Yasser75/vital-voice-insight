CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  department text NOT NULL DEFAULT 'General Medicine',
  preferred_date date NOT NULL,
  preferred_time text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['doctor'::app_role,'admin'::app_role]));
CREATE POLICY "Patients request appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'::app_role));