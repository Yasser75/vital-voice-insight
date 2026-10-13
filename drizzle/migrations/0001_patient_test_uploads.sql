CREATE POLICY "Patients upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Patients and staff read uploads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_any_role(auth.uid(), ARRAY['doctor','admin','labs']::public.app_role[])));

CREATE POLICY "Patients add results for own tests" ON public.test_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.medical_tests m WHERE m.id = test_id AND m.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.mark_test_completed_on_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.medical_tests SET status = 'completed', completed_at = now()
  WHERE id = NEW.test_id AND status <> 'completed';
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mark_test_completed_on_result() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER test_results_mark_completed AFTER INSERT ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.mark_test_completed_on_result();