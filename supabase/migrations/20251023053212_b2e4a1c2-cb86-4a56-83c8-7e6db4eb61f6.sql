-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add test scheduling fields to medical_tests table
ALTER TABLE public.medical_tests 
  ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN scheduled_time TIME,
  ADD COLUMN department TEXT,
  ADD COLUMN notes TEXT,
  ADD COLUMN priority TEXT DEFAULT 'normal';

-- Create function to get consultation stats
CREATE OR REPLACE FUNCTION public.get_consultation_stats()
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_consultations', (SELECT COUNT(*) FROM public.consultations),
    'today_consultations', (SELECT COUNT(*) FROM public.consultations WHERE DATE(consultation_date) = CURRENT_DATE),
    'total_tests', (SELECT COUNT(*) FROM public.medical_tests),
    'pending_tests', (SELECT COUNT(*) FROM public.medical_tests WHERE status = 'pending'),
    'completed_tests', (SELECT COUNT(*) FROM public.medical_tests WHERE status = 'completed'),
    'total_patients', (SELECT COUNT(*) FROM public.patients)
  )
$$;

-- RLS policy for stats function (admins only)
CREATE POLICY "Admins can view all consultations"
  ON public.consultations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can view all medical tests"
  ON public.medical_tests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can view all patients"
  ON public.patients
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);