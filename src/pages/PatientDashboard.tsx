import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, FileText, TestTube, Calendar, Clock, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';

interface Consultation {
  id: string;
  consultation_date: string;
  diagnosis: string;
  symptoms: string[];
}

interface TestResult {
  id: string;
  created_at: string;
  ai_analysis: string;
  ai_remarks: string;
  result_file_url: string;
  anomalies_detected: any;
  test_id: string;
  medical_tests: {
    test_name: string;
    test_type: string;
  };
}

interface UpcomingTest {
  id: string;
  test_name: string;
  test_type: string;
  scheduled_date: string;
  scheduled_time: string;
  department: string;
  status: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPatientAndLoadData();
  }, []);

  const checkPatientAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is patient
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'patient');

      if (!roles || roles.length === 0) {
        navigate('/');
        return;
      }

      // Load consultations
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', user.id)
        .order('consultation_date', { ascending: false });

      if (consultationsData) {
        setConsultations(consultationsData);
      }

      // Load test results
      const { data: resultsData } = await supabase
        .from('test_results')
        .select('*, medical_tests(test_name, test_type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resultsData) {
        setTestResults(resultsData as any);
      }

      // Load upcoming tests
      const { data: upcomingData } = await supabase
        .from('medical_tests')
        .select('id, test_name, test_type, scheduled_date, scheduled_time, department, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true });

      if (upcomingData) {
        setUpcomingTests(upcomingData);
      }
    } catch (error: any) {
      console.error('Error loading patient data:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-medical">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{t('patient.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              {t('patient.upcomingAppointments')}
            </h2>
            <div className="grid gap-4">
              {upcomingTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      {t('patient.noUpcomingAppointments')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{test.test_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {test.department}
                          </p>
                        </div>
                        <Badge>{test.test_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(test.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{test.scheduled_time}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Consultations History */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-secondary" />
              {t('patient.consultationHistory')}
            </h2>
            <div className="grid gap-4">
              {consultations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      {t('patient.noConsultations')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                consultations.map((consultation) => (
                  <Card key={consultation.id}>
                    <CardHeader>
                      <CardTitle>
                        {new Date(consultation.consultation_date).toLocaleDateString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-semibold">{t('patient.diagnosis')}:</p>
                        <p className="text-muted-foreground">{consultation.diagnosis}</p>
                        {consultation.symptoms && consultation.symptoms.length > 0 && (
                          <>
                            <p className="font-semibold mt-4">{t('patient.symptoms')}:</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {consultation.symptoms.map((symptom, idx) => (
                                <li key={idx}>{symptom}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Test Results History */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TestTube className="w-6 h-6 text-accent" />
              {t('patient.testResultsHistory')}
            </h2>
            <div className="grid gap-4">
              {testResults.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      {t('patient.noTestResults')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                testResults.map((result) => {
                  const isXRay = result.medical_tests?.test_type?.toLowerCase().includes('x-ray') || 
                                 result.medical_tests?.test_type?.toLowerCase().includes('xray');
                  const anomalies = result.anomalies_detected;

                  return (
                    <Card key={result.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>
                              {result.medical_tests?.test_name || t('patient.testResult')}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(result.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {isXRay && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              X-Ray
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* X-Ray Image with Highlighted Abnormalities */}
                          {isXRay && result.result_file_url && (
                            <div className="space-y-3">
                              <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                                <img
                                  src={result.result_file_url}
                                  alt="X-ray result"
                                  className="w-full h-auto max-h-96 object-contain"
                                />
                                
                                {anomalies && Array.isArray(anomalies) && anomalies.map((anomaly: any, index: number) => (
                                  <div
                                    key={index}
                                    className="absolute border-2 border-red-500 bg-red-500/20 rounded"
                                    style={{
                                      left: `${anomaly.coordinates?.x || 0}%`,
                                      top: `${anomaly.coordinates?.y || 0}%`,
                                      width: `${anomaly.coordinates?.width || 10}%`,
                                      height: `${anomaly.coordinates?.height || 10}%`,
                                    }}
                                  >
                                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                      {anomaly.description}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* AI Detected Anomalies */}
                              {anomalies && Array.isArray(anomalies) && anomalies.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wide">
                                      Detected Abnormalities
                                    </h3>
                                  </div>
                                  {anomalies.map((anomaly: any, index: number) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-accent rounded-lg border border-border space-y-2"
                                    >
                                      <div className="flex items-start justify-between">
                                        <p className="text-sm font-medium">{anomaly.description}</p>
                                        <Badge
                                          variant={
                                            anomaly.severity === 'high'
                                              ? 'destructive'
                                              : anomaly.severity === 'medium'
                                              ? 'default'
                                              : 'secondary'
                                          }
                                        >
                                          {anomaly.severity}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Location: {anomaly.location}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Analysis / Diagnosis */}
                          {result.ai_analysis && (
                            <div className="space-y-2">
                              <p className="font-semibold text-sm uppercase tracking-wide text-primary">
                                AI Diagnosis
                              </p>
                              <p className="text-sm text-foreground leading-relaxed bg-accent/50 p-3 rounded-lg">
                                {result.ai_analysis}
                              </p>
                            </div>
                          )}

                          {/* AI Recommendations */}
                          {result.ai_remarks && (
                            <div className="space-y-2">
                              <p className="font-semibold text-sm uppercase tracking-wide text-secondary">
                                Recommendations
                              </p>
                              <p className="text-sm text-foreground leading-relaxed bg-secondary/10 p-3 rounded-lg">
                                {result.ai_remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
