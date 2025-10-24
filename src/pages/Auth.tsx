import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Redirect based on user role
        try {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

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
          navigate('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-medical">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Health Assistant
          </h1>
          <p className="text-muted-foreground">
            Advanced medical diagnosis and analysis platform
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your medical consultation dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(188 78% 41%)',
                      brandAccent: 'hsl(188 78% 55%)',
                    },
                  },
                },
              }}
              providers={[]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}