import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Activity, LogOut, TestTube, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';

interface MedicalTest {
  id: string;
  test_name: string;
  test_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  department: string;
  priority: string;
  notes: string;
  completed_at?: string;
  patients: {
    full_name: string;
    email: string;
  };
}

export default function LabsDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTest, setProcessingTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkLabsAndLoadData();
  }, []);

  const checkLabsAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is labs
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'labs');

      if (!roles || roles.length === 0) {
        navigate('/');
        return;
      }

      loadTests();
    } catch (error: any) {
      console.error('Error loading labs data:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    const { data: testsData } = await supabase
      .from('medical_tests')
      .select('*, patients(full_name, email)')
      .order('scheduled_date', { ascending: true });

    if (testsData) {
      setTests(testsData as any);
    }
  };

  const handleCompleteTest = async (testId: string, patientUserId: string) => {
    if (!testResults[testId]) {
      toast({
        title: t('common.error'),
        description: t('labs.enterResults'),
        variant: 'destructive',
      });
      return;
    }

    setProcessingTest(testId);

    try {
      // Update test status
      await supabase
        .from('medical_tests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', testId);

      // Create test result
      await supabase
        .from('test_results')
        .insert({
          test_id: testId,
          user_id: patientUserId,
          ai_analysis: testResults[testId],
        });

      toast({
        title: t('common.success'),
        description: t('labs.testCompleted'),
      });

      loadTests();
      setTestResults((prev) => {
        const newResults = { ...prev };
        delete newResults[testId];
        return newResults;
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingTest(null);
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

  const pendingTests = tests.filter(t => t.status === 'pending');
  const completedTests = tests.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-medical">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{t('labs.title')}</h1>
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
          {/* Pending Tests */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-500" />
              {t('labs.pendingTests')} ({pendingTests.length})
            </h2>
            <div className="grid gap-4">
              {pendingTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      {t('labs.noPendingTests')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{test.test_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {test.patients?.full_name} ({test.patients?.email})
                          </p>
                        </div>
                        <Badge variant={test.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {test.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold">{t('labs.testType')}:</p>
                          <p className="text-muted-foreground">{test.test_type}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{t('labs.department')}:</p>
                          <p className="text-muted-foreground">{test.department}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{t('labs.scheduledDate')}:</p>
                          <p className="text-muted-foreground">
                            {test.scheduled_date ? new Date(test.scheduled_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">{t('labs.scheduledTime')}:</p>
                          <p className="text-muted-foreground">{test.scheduled_time || 'N/A'}</p>
                        </div>
                      </div>
                      {test.notes && (
                        <div>
                          <p className="font-semibold text-sm">{t('labs.notes')}:</p>
                          <p className="text-sm text-muted-foreground">{test.notes}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">{t('labs.enterResults')}:</label>
                        <Textarea
                          placeholder={t('labs.resultsPlaceholder')}
                          value={testResults[test.id] || ''}
                          onChange={(e) => setTestResults({ ...testResults, [test.id]: e.target.value })}
                        />
                      </div>
                      <Button 
                        onClick={() => handleCompleteTest(test.id, test.patients?.email)}
                        disabled={processingTest === test.id}
                        className="w-full"
                      >
                        {processingTest === test.id ? t('common.loading') : t('labs.markComplete')}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Completed Tests */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              {t('labs.completedTests')} ({completedTests.length})
            </h2>
            <div className="grid gap-4">
              {completedTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      {t('labs.noCompletedTests')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle>{test.test_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {test.patients?.full_name} ({test.patients?.email})
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {t('labs.completedOn')}: {test.completed_at ? new Date(test.completed_at).toLocaleString() : 'N/A'}
                      </p>
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
