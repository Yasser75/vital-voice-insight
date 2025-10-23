import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, FileText, ImageIcon, LogOut, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
      
      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roles);
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

            {/* X-Ray Analysis Card */}
            <Card 
              className="shadow-card hover:shadow-medical transition-shadow cursor-pointer group"
              onClick={() => navigate('/xray-analysis')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{t('dashboard.xray.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.xray.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    {t('dashboard.xray.features.upload')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    {t('dashboard.xray.features.detection')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    {t('dashboard.xray.features.highlighting')}
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-4">
                  {t('dashboard.xray.button')}
                </Button>
              </CardContent>
            </Card>
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