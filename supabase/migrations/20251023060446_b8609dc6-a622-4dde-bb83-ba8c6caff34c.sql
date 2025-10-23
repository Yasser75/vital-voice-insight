-- Create a function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Update RLS policies for consultations to include doctor role
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admins and doctors can view all consultations" ON public.consultations;
CREATE POLICY "Admins and doctors can view all consultations"
ON public.consultations
FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'doctor'::app_role]) 
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can create their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors can create consultations" ON public.consultations;
CREATE POLICY "Doctors can create consultations"
ON public.consultations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor'::app_role));

DROP POLICY IF EXISTS "Users can update their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors can update consultations" ON public.consultations;
CREATE POLICY "Doctors can update consultations"
ON public.consultations
FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'::app_role));

-- Update RLS policies for medical_tests
DROP POLICY IF EXISTS "Admins can view all medical tests" ON public.medical_tests;
DROP POLICY IF EXISTS "Admins, doctors, and labs can view all medical tests" ON public.medical_tests;
CREATE POLICY "Admins, doctors, and labs can view all medical tests"
ON public.medical_tests
FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'doctor'::app_role, 'labs'::app_role])
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can create their own medical tests" ON public.medical_tests;
DROP POLICY IF EXISTS "Doctors can create medical tests" ON public.medical_tests;
CREATE POLICY "Doctors can create medical tests"
ON public.medical_tests
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor'::app_role));

DROP POLICY IF EXISTS "Users can update their own medical tests" ON public.medical_tests;
DROP POLICY IF EXISTS "Doctors and labs can update medical tests" ON public.medical_tests;
CREATE POLICY "Doctors and labs can update medical tests"
ON public.medical_tests
FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['doctor'::app_role, 'labs'::app_role]));

-- Update RLS policies for test_results
DROP POLICY IF EXISTS "Users can view their own test results" ON public.test_results;
DROP POLICY IF EXISTS "Everyone authorized can view test results" ON public.test_results;
CREATE POLICY "Everyone authorized can view test results"
ON public.test_results
FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'doctor'::app_role, 'labs'::app_role])
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can create their own test results" ON public.test_results;
DROP POLICY IF EXISTS "Labs can create test results" ON public.test_results;
CREATE POLICY "Labs can create test results"
ON public.test_results
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'labs'::app_role));

DROP POLICY IF EXISTS "Users can update their own test results" ON public.test_results;
DROP POLICY IF EXISTS "Labs can update test results" ON public.test_results;
CREATE POLICY "Labs can update test results"
ON public.test_results
FOR UPDATE
USING (public.has_role(auth.uid(), 'labs'::app_role));

-- Update patients table policies
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;
CREATE POLICY "Staff can view all patients"
ON public.patients
FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'doctor'::app_role, 'labs'::app_role])
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can create their own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can create patients" ON public.patients;
CREATE POLICY "Doctors can create patients"
ON public.patients
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor'::app_role));

DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
CREATE POLICY "Doctors can update patients"
ON public.patients
FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'::app_role));