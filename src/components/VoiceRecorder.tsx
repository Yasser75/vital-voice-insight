import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, audioUrl?: string) => void;
}

export const VoiceRecorder = ({ onTranscriptComplete }: VoiceRecorderProps) => {
  const { i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef('');
  const stoppingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({
        title: 'Not supported',
        description: 'Live transcription needs Google Chrome or Microsoft Edge.',
        variant: 'destructive',
      });
      return;
    }
    const rec = new SR();
    rec.lang = i18n.language?.startsWith('ur') ? 'ur-PK' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = '';
    stoppingRef.current = false;
    setFinalText('');
    setInterim('');

    rec.onresult = (e: any) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += txt.trim() + ' ';
        else live += txt;
      }
      setFinalText(finalRef.current);
      setInterim(live);
      onTranscriptComplete(finalRef.current.trim());
    };
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      toast({
        title: 'Microphone Error',
        description: e.error === 'not-allowed' ? 'Please allow microphone access.' : `Transcription error: ${e.error}`,
        variant: 'destructive',
      });
      stoppingRef.current = true;
      setIsRecording(false);
    };
    rec.onend = () => {
      // Browser stops after silence; keep listening until the user clicks stop
      if (!stoppingRef.current) {
        try { rec.start(); return; } catch { /* ignore */ }
      }
      setIsRecording(false);
      setInterim('');
      onTranscriptComplete(finalRef.current.trim());
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    toast({ title: 'Recording Started', description: "Speak clearly about the patient's symptoms" });
  };

  const stopRecording = () => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        size="lg"
        className={`w-24 h-24 rounded-full shadow-medical hover:scale-105 transition-transform ${isRecording ? 'animate-pulse' : ''}`}
        variant={isRecording ? 'destructive' : 'default'}
      >
        {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isRecording ? 'Listening... Click to stop' : 'Click to start recording'}
      </p>
      {(isRecording || finalText) && (
        <div className="w-full rounded-md border border-border bg-muted/40 p-3 text-sm min-h-16" dir="auto">
          <span>{finalText}</span>
          <span className="text-muted-foreground italic">{interim}</span>
          {!finalText && !interim && <span className="text-muted-foreground">Waiting for speech...</span>}
        </div>
      )}
    </div>
  );
};
