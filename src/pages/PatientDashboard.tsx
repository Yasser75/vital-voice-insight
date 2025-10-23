import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, FileText, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  test_id: string;
  medical_tests: {
    test_name: string;
    test_type: string;
  };
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
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
          {/* Consultations */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {t('patient.consultations')}
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

          {/* Test Results */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              {t('patient.testResults')}
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
                testResults.map((result) => (
                  <Card key={result.id}>
                    <CardHeader>
                      <CardTitle>
                        {result.medical_tests?.test_name || t('patient.testResult')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </p>
                        {result.ai_analysis && (
                          <>
                            <p className="font-semibold mt-4">{t('patient.analysis')}:</p>
                            <p className="text-muted-foreground">{result.ai_analysis}</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
