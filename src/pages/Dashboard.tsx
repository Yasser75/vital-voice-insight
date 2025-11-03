import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, FileText, LogOut, Shield, TestTube, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';

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
              {t('dashboard.xray.title')}
            </h2>
            <div className="grid gap-4">
              {testResults.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      No test results available
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
                              {result.medical_tests?.test_name || 'Test Result'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.medical_tests?.consultations?.patients?.full_name} ({result.medical_tests?.consultations?.patients?.email})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {result.medical_tests?.test_type || 'Test'}
                          </Badge>
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