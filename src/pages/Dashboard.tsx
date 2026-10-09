import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, FileText, LogOut, Shield, TestTube } from 'lucide-react';
import TestResultsTable from '@/components/TestResultsTable';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import DoctorAppointments from '@/components/DoctorAppointments';

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
    consultations: {
      patients: {
        full_name: string;
        email: string;
      };
    };
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setUser(user);
      
      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roles);

      // Load test results for all patients (doctors can see all)
      const { data: resultsData, error } = await supabase
        .from('test_results')
        .select(`
          *,
          medical_tests(test_name, test_type, consultation_id, consultations(patient_id, patients(full_name, email)))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading test results:', error);
      } else if (resultsData) {
        setTestResults(resultsData as any);
      }
    } catch (error: any) {
      console.error('Error:', error);
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
    navigate('/auth');
    toast({
      title: t('common.success'),
      description: "You have been successfully signed out",
    });
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
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-medical">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Health Assistant</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">{t('dashboard.title')}</h2>
            <p className="text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>
          
          {isAdmin && (
            <Card className="bg-gradient-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-bold">Admin Panel</h3>
                      <p className="text-sm text-muted-foreground">
                        View hospital statistics and manage system
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/admin')}>
                    {t('dashboard.admin.button')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <DoctorAppointments />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Consultation Card */}
            <Card 
              className="shadow-card hover:shadow-medical transition-shadow cursor-pointer group"
              onClick={() => navigate('/consultation')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{t('dashboard.consultation.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.consultation.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('dashboard.consultation.features.voice')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('dashboard.consultation.features.analysis')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('dashboard.consultation.features.tests')}
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  {t('dashboard.consultation.button')}
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Medical Test Results Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TestTube className="w-6 h-6 text-accent" />
              Medical Test Analysis
            </h2>
            <TestResultsTable testResults={testResults} />
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('dashboard.about.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {t('dashboard.about.description')}
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Transcribe patient consultations in real-time</li>
                <li>• Provide intelligent diagnosis suggestions based on symptoms</li>
                <li>• Recommend appropriate medical tests</li>
                <li>• Analyze medical imaging for anomalies</li>
                <li>• Generate comprehensive reports</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Important:</strong> {t('dashboard.about.disclaimer')}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}