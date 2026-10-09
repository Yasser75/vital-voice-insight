import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Activity, LogOut, FileText, Calendar, Clock, TestTube, Image as ImageIcon, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RequestAppointmentDialog from '@/components/RequestAppointmentDialog';
import XRayViewer from '@/components/XRayViewer';

const isXRay = (type?: string) => !!type && /x-?ray/i.test(type);

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [patientName, setPatientName] = useState('Patient');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const loadAppointments = async (uid: string) => {
    const { data } = await supabase.from('appointments').select('*').eq('user_id', uid).order('preferred_date');
    setAppointments(data || []);
  };

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'patient');
      if (!roles?.length) return navigate('/');

      const [{ data: patient }, { data: cons }, { data: upcoming }] = await Promise.all([
        supabase.from('patients').select('full_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('consultations')
          .select('id, consultation_date, diagnosis, symptoms, medical_tests(id, test_name, test_type, department, status, test_results(*))')
          .eq('user_id', user.id).order('consultation_date', { ascending: false }),
        supabase.from('medical_tests').select('*').eq('user_id', user.id).eq('status', 'pending').order('scheduled_date'),
      ]);
      if (patient) setPatientName(patient.full_name);
      setVisits(cons || []);
      setUpcomingTests(upcoming || []);
      await loadAppointments(user.id);
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-medical">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('patient.title')}</h1>
              <p className="text-sm text-muted-foreground">{patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />{t('common.signOut')}</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Appointments */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" />{t('patient.upcomingAppointments')}</h2>
            <RequestAppointmentDialog patientName={patientName} onCreated={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) loadAppointments(user.id);
            }} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {appointments.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" />{a.department}</p>
                    <Badge variant={a.status === 'confirmed' ? 'default' : 'secondary'}>{a.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.reason}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(a.preferred_date).toLocaleDateString()}</span>
                    {a.preferred_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{a.preferred_time}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {upcomingTests.map((test) => (
              <Card key={test.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold flex items-center gap-2"><TestTube className="w-4 h-4 text-primary" />{test.test_name}</p>
                    <Badge variant="outline">Lab test</Badge>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {test.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(test.scheduled_date).toLocaleDateString()}</span>}
                    {test.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{test.scheduled_time}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {appointments.length === 0 && upcomingTests.length === 0 && (
              <Card className="md:col-span-2"><CardContent className="pt-6 text-center text-muted-foreground">{t('patient.noUpcomingAppointments')}</CardContent></Card>
            )}
          </div>
        </section>

        {/* Visits with linked test results */}
        <section>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><FileText className="w-6 h-6 text-secondary" />{t('patient.consultationHistory')}</h2>
          <p className="text-sm text-muted-foreground mb-4">Open a visit to see the AI diagnosis and the test results from that visit.</p>
          {visits.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">{t('patient.noConsultations')}</CardContent></Card>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {visits.map((v) => {
                const tests = v.medical_tests || [];
                const hasXray = tests.some((m: any) => isXRay(m.test_type));
                return (
                  <AccordionItem key={v.id} value={v.id} className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left gap-1">
                        <span className="text-sm text-muted-foreground">{new Date(v.consultation_date).toLocaleDateString()}</span>
                        <span className="font-semibold text-primary underline-offset-4 hover:underline">{v.diagnosis}</span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{tests.length} test{tests.length !== 1 && 's'}</Badge>
                          {hasXray && <Badge variant="destructive" className="gap-1"><ImageIcon className="w-3 h-3" />X-Ray</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-xs uppercase font-semibold text-primary mb-1">AI Diagnosis</p>
                        <p className="text-sm">{v.diagnosis}</p>
                        {v.symptoms?.length > 0 && <p className="text-xs text-muted-foreground mt-2">Symptoms: {v.symptoms.join(', ')}</p>}
                      </div>
                      {tests.length === 0 && <p className="text-sm text-muted-foreground">No tests were ordered at this visit.</p>}
                      {tests.map((m: any) => (
                        <Card key={m.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-base">{m.test_name}</CardTitle>
                              <Badge variant="outline">{m.status}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {(m.test_results || []).length === 0 && <p className="text-sm text-muted-foreground">Result not available yet.</p>}
                            {(m.test_results || []).map((r: any) => (
                              <div key={r.id} className="space-y-3">
                                {isXRay(m.test_type) && r.result_file_url && <XRayViewer url={r.result_file_url} anomalies={r.anomalies_detected} />}
                                {r.ai_analysis && (
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-primary mb-1">AI Analysis</p>
                                    <p className="text-sm bg-accent/50 p-3 rounded-lg">{r.ai_analysis}</p>
                                  </div>
                                )}
                                {r.ai_remarks && (
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-secondary mb-1">Recommendations</p>
                                    <p className="text-sm bg-secondary/10 p-3 rounded-lg">{r.ai_remarks}</p>
                                  </div>
                                )}
                                {r.doctor_advice && (
                                  <div>
                                    <p className="text-xs uppercase font-semibold mb-1">Doctor's Advice</p>
                                    <p className="text-sm border p-3 rounded-lg">{r.doctor_advice}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </section>
      </main>
    </div>
  );
}
