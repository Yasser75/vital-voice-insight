import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import botLogo from '@/assets/boteye-health-bot.png';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingUpDemo, setSettingUpDemo] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        redirectBasedOnRole(user.id);
      }
    });
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roles && roles.length > 0) {
        const role = roles[0].role;
        switch (role) {
          case 'doctor':
            navigate('/dashboard');
            break;
          case 'admin':
            navigate('/admin');
            break;
          case 'patient':
            navigate('/patient-dashboard');
            break;
          case 'labs':
            navigate('/labs-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleSetupDemo = async () => {
    setSettingUpDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-demo-users', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Demo users created successfully! You can now login with:\n• admin@example.com / admin\n• doctor@example.com / admin\n• patient@example.com / admin\n• labs@example.com / admin',
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSettingUpDemo(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await redirectBasedOnRole(data.user.id);
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img 
              src={botLogo} 
              alt="Health-AI Agent" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Health-AI Agent
          </h1>
          <p className="text-muted-foreground">
            {t('auth.subtitle')}
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{t('auth.signIn')}</CardTitle>
            <CardDescription>
              {t('auth.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSetupDemo} 
              variant="outline" 
              className="w-full"
              disabled={settingUpDemo}
            >
              {settingUpDemo ? t('common.loading') : 'Setup Demo Users'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>{t('auth.demoCredentials')}</p>
          <p className="font-mono mt-2">Click "Setup Demo Users" button above</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
