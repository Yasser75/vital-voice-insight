import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, FileText, ImageIcon, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    } else {
      setUser(user);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

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
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Welcome to Your Dashboard</h2>
            <p className="text-muted-foreground">
              Choose a feature to get started with AI-powered medical assistance
            </p>
          </div>

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
                <CardTitle>Patient Consultation</CardTitle>
                <CardDescription>
                  Record patient symptoms and receive AI-powered diagnosis with confidence scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Voice-to-text transcription
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    AI symptom analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Medical test recommendations
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  Start Consultation
                </Button>
              </CardContent>
            </Card>

            {/* X-Ray Analysis Card */}
            <Card 
              className="shadow-card hover:shadow-medical transition-shadow cursor-pointer group"
              onClick={() => navigate('/xray-analysis')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>X-Ray Analysis</CardTitle>
                <CardDescription>
                  Upload medical imaging for AI-powered anomaly detection and highlighting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    Upload X-ray images
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    AI anomaly detection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    Visual highlighting of concerns
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-4">
                  Analyze X-Ray
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                About This Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                This AI Health Assistant uses advanced machine learning models to:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Transcribe patient consultations in real-time</li>
                <li>• Provide intelligent diagnosis suggestions based on symptoms</li>
                <li>• Recommend appropriate medical tests</li>
                <li>• Analyze medical imaging for anomalies</li>
                <li>• Generate comprehensive reports</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Important:</strong> This system is designed to assist healthcare professionals 
                and should not replace professional medical judgment. Always consult with qualified 
                healthcare providers for final diagnosis and treatment decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}