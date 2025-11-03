-- Add doctor remarks and advice fields to test_results table
ALTER TABLE public.test_results 
ADD COLUMN IF NOT EXISTS doctor_remarks TEXT,
ADD COLUMN IF NOT EXISTS doctor_advice TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_results_reviewed_by ON public.test_results(reviewed_by);

-- Add RLS policy for doctors to update their reviews
CREATE POLICY "Doctors can update their reviews" 
ON public.test_results 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role))
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));