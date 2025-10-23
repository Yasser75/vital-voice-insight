import { useState } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Consultation() {
  const [transcript, setTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const { toast } = useToast();

  const handleTranscriptComplete = (transcriptText: string) => {
    setTranscript(transcriptText);
  };

  const analyzeSymptoms = async () => {
    if (!transcript) {
      toast({
        title: "No transcript",
        description: "Please record a consultation first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Extract symptoms from transcript (simplified for MVP)
      const symptoms = transcript.toLowerCase().includes('headache') ? ['headache', 'dizziness', 'light sensitivity'] : ['general discomfort'];

      const { data, error } = await supabase.functions.invoke('ai-diagnosis', {
        body: { symptoms, transcript }
      });

      if (error) throw error;

      setDiagnosis(data.diagnosis);
      setConfidence(data.confidence);
      
      toast({
        title: "Analysis Complete",
        description: "AI diagnosis generated successfully",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Patient Consultation
          </h1>
          <p className="text-muted-foreground">
            Record patient symptoms and receive AI-powered analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recording Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Voice Recording
              </CardTitle>
              <CardDescription>
                Record the patient's symptoms and medical history
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <VoiceRecorder onTranscriptComplete={handleTranscriptComplete} />
              
              {transcript && (
                <div className="w-full space-y-4">
                  <div className="p-4 bg-accent rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Transcript
                    </h3>
                    <p className="text-sm text-muted-foreground">{transcript}</p>
                  </div>
                  
                  <Button 
                    onClick={analyzeSymptoms}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Generate AI Diagnosis'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnosis Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                AI Diagnosis
              </CardTitle>
              <CardDescription>
                AI-powered analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnosis ? (
                <div className="space-y-4">
                  {confidence && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Confidence:</span>
                      <Badge variant={confidence > 80 ? "default" : "secondary"}>
                        {confidence}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gradient-card rounded-lg border border-border">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-foreground">{diagnosis}</p>
                    </div>
                  </div>

                  <Button variant="secondary" className="w-full">
                    Generate Test Requests
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Record a consultation and click "Generate AI Diagnosis" to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}