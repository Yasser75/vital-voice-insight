import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TestResultDetail {
  id: string;
  created_at: string;
  ai_analysis: string;
  ai_remarks: string;
  doctor_remarks: string;
  doctor_advice: string;
  result_file_url: string;
  anomalies_detected: any;
  reviewed_at: string;
  test_id: string;
  medical_tests: {
    test_name: string;
    test_type: string;
    status: string;
    requested_at: string;
    consultations: {
      patients: {
        full_name: string;
        email: string;
        phone: string;
        date_of_birth: string;
      };
    };
  };
}

export default function TestResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestResultDetail | null>(null);
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [showAiHighlight, setShowAiHighlight] = useState(true);

  useEffect(() => {
    loadTestResult();
  }, [id]);

  const loadTestResult = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          medical_tests(
            test_name,
            test_type,
            status,
            requested_at,
            consultations(
              patients(full_name, email, phone, date_of_birth)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setTestResult(data as any);
      setDoctorRemarks(data.doctor_remarks || '');
      setDoctorAdvice(data.doctor_advice || '');
    } catch (error: any) {
      console.error('Error loading test result:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('test_results')
        .update({
          doctor_remarks: doctorRemarks,
          doctor_advice: doctorAdvice,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Doctor remarks and advice saved successfully',
      });

      loadTestResult();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Test result not found</p>
      </div>
    );
  }

  const patient = testResult.medical_tests?.consultations?.patients;
  const isXRay = testResult.medical_tests?.test_type?.toLowerCase().includes('x-ray') || 
                 testResult.medical_tests?.test_type?.toLowerCase().includes('xray');
  const anomalies = testResult.anomalies_detected;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patient?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{calculateAge(patient?.date_of_birth)} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient?.phone || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{testResult.medical_tests?.test_name}</CardTitle>
                <Badge variant="secondary">{testResult.medical_tests?.test_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Test Date</p>
                  <p className="font-medium">
                    {new Date(testResult.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{testResult.medical_tests?.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested</p>
                  <p className="font-medium">
                    {new Date(testResult.medical_tests?.requested_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* X-Ray Image with AI Highlights */}
          {isXRay && testResult.result_file_url && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>X-Ray Image</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-highlight"
                      checked={showAiHighlight}
                      onCheckedChange={setShowAiHighlight}
                    />
                    <Label htmlFor="ai-highlight" className="flex items-center gap-2">
                      {showAiHighlight ? (
                        <>
                          <Eye className="w-4 h-4" />
                          AI Highlights On
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          AI Highlights Off
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                  <img
                    src={testResult.result_file_url}
                    alt="X-ray result"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                  
                  {showAiHighlight && anomalies && Array.isArray(anomalies) && anomalies.map((anomaly: any, index: number) => (
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
              </CardContent>
            </Card>
          )}

          {/* AI Detected Anomalies */}
          {anomalies && Array.isArray(anomalies) && anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  AI Detected Abnormalities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {anomalies.map((anomaly: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-accent rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{anomaly.description}</p>
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
                    <p className="text-sm text-muted-foreground">
                      Location: {anomaly.location}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {testResult.ai_analysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed bg-accent/50 p-4 rounded-lg">
                  {testResult.ai_analysis}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {testResult.ai_remarks && (
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed bg-secondary/10 p-4 rounded-lg">
                  {testResult.ai_remarks}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Doctor's Remarks */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor's Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your observations and comments about this test result..."
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          {/* Doctor's Advice */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor's Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your recommendations: medications, dosage, follow-up tests, lifestyle advice, referrals..."
                value={doctorAdvice}
                onChange={(e) => setDoctorAdvice(e.target.value)}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          {/* Review Status */}
          {testResult.reviewed_at && (
            <Card className="bg-accent/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Last reviewed: {new Date(testResult.reviewed_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Review'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
