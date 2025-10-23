import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Activity, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TestScheduleDialog from '@/components/TestScheduleDialog';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Consultation() {
  const { t } = useTranslation();
  const [transcript, setTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [editedDiagnosis, setEditedDiagnosis] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTranscriptComplete = (transcriptText: string) => {
    setTranscript(transcriptText);
  };

  const analyzeSymptoms = async () => {
    if (!transcript) {
      toast({
        title: t('common.error'),
        description: "Please record a consultation first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a dummy patient for MVP (in production, this would be selected from a list)
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let patientId = patient?.id;

      if (!patientId) {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            full_name: 'Demo Patient',
            email: user.email || 'demo@example.com',
          })
          .select('id')
          .single();

        if (createError) throw createError;
        patientId = newPatient.id;
      }

      // Extract symptoms from transcript
      const symptoms = transcript.toLowerCase().includes('headache') 
        ? ['headache', 'dizziness', 'light sensitivity'] 
        : ['general discomfort'];

      const { data, error } = await supabase.functions.invoke('ai-diagnosis', {
        body: { symptoms, transcript }
      });

      if (error) throw error;

      // Save consultation
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          user_id: user.id,
          patient_id: patientId,
          transcript,
          diagnosis: data.diagnosis,
          ai_confidence: data.confidence,
          symptoms,
        })
        .select('id')
        .single();

      if (consultationError) throw consultationError;

      setConsultationId(consultation.id);
      setDiagnosis(data.diagnosis);
      setEditedDiagnosis(data.diagnosis);
      setConfidence(data.confidence);
      
      toast({
        title: t('common.success'),
        description: "AI diagnosis generated successfully",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : "Failed to generate diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditDiagnosis = () => {
    setEditedDiagnosis(diagnosis);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedDiagnosis(diagnosis);
    setIsEditing(false);
  };

  const handleSaveDiagnosis = async () => {
    if (!consultationId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ diagnosis: editedDiagnosis })
        .eq('id', consultationId);

      if (error) throw error;

      setDiagnosis(editedDiagnosis);
      setIsEditing(false);

      toast({
        title: t('common.success'),
        description: "Diagnosis updated successfully",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : "Failed to update diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t('consultation.title')}
            </h1>
            <p className="text-muted-foreground">
              Record patient symptoms and receive AI-powered analysis
            </p>
          </div>
          <LanguageSwitcher />
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
                        {t('common.loading')}
                      </>
                    ) : (
                      t('consultation.analyzeButton')
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
                {t('consultation.diagnosis')}
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
                      <span className="text-sm font-medium">{t('consultation.confidence')}:</span>
                      <Badge variant={confidence > 80 ? "default" : "secondary"}>
                        {confidence}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gradient-card rounded-lg border border-border">
                    {isEditing ? (
                      <Textarea
                        value={editedDiagnosis}
                        onChange={(e) => setEditedDiagnosis(e.target.value)}
                        className="min-h-[200px] text-foreground"
                        placeholder="Edit diagnosis..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-foreground">{diagnosis}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveDiagnosis}
                          disabled={isSaving}
                          className="flex-1"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {t('common.save')}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('common.cancel')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditDiagnosis}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </Button>
                    )}
                  </div>

                  {consultationId && !isEditing && (
                    <TestScheduleDialog 
                      consultationId={consultationId}
                      recommendedTest={diagnosis.includes('blood') ? 'Complete Blood Count' : undefined}
                    />
                  )}
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