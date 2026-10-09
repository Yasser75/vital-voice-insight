import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, audioUrl?: string) => void;
}

// Audio is recorded in short segments so text appears while the patient is still talking.
const SEGMENT_MS = 6000;

export const VoiceRecorder = ({ onTranscriptComplete }: VoiceRecorderProps) => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [pending, setPending] = useState(0);
  const [text, setText] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const textRef = useRef('');
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const cleanup = () => {
    activeRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);

  const transcribe = (blob: Blob) => {
    if (blob.size < 2000) return; // silence / empty
    setPending((p) => p + 1);
    // keep segments in order
    queueRef.current = queueRef.current.then(async () => {
      try {
        const fd = new FormData();
        fd.append('file', new File([blob], 'segment.webm', { type: 'audio/webm' }));
        fd.append('language', i18n.language?.startsWith('ur') ? 'ur' : 'en');
        const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: fd });
        if (error) {
          const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
          throw new Error(details);
        }
        if (data?.text) {
          textRef.current = `${textRef.current} ${data.text}`.trim();
          setText(textRef.current);
          onTranscriptComplete(textRef.current);
        }
      } catch (e) {
        console.error('Transcription error', e);
        toast({ title: 'Transcription failed', description: 'Part of the recording could not be transcribed.', variant: 'destructive' });
      } finally {
        setPending((p) => p - 1);
      }
    });
  };

  const recordSegment = () => {
    if (!activeRef.current || !streamRef.current) return;
    const rec = new MediaRecorder(streamRef.current);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      transcribe(new Blob(chunks, { type: 'audio/webm' }));
      if (activeRef.current) recordSegment();
    };
    recorderRef.current = rec;
    rec.start();
    timerRef.current = window.setTimeout(() => rec.state === 'recording' && rec.stop(), SEGMENT_MS);
  };

  const startRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({ title: 'Microphone Error', description: 'Please allow microphone access.', variant: 'destructive' });
      return;
    }
    textRef.current = '';
    setText('');
    activeRef.current = true;
    setIsRecording(true);
    recordSegment();
  };

  const stopRecording = () => {
    setIsRecording(false);
    cleanup();
  };

  const busy = pending > 0;

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
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        {isRecording ? 'Listening... Click to stop' : busy ? 'Finishing transcription...' : 'Click to start recording'}
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      </p>
      {(isRecording || text || busy) && (
        <div className="w-full rounded-md border border-border bg-muted/40 p-3 text-sm min-h-16" dir="auto">
          {text || <span className="text-muted-foreground">Text will appear every few seconds while you speak...</span>}
        </div>
      )}
    </div>
  );
};
