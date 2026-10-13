import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX = 20 * 1024 * 1024;

/** Lets a patient upload a report done at an outside lab for a pending test. */
export default function UploadTestResultDialog({ test, onUploaded }: { test: any; onUploaded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [labName, setLabName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX) {
      toast({ title: 'File too large', description: 'Please upload a file under 20 MB.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${test.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('patient-uploads').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from('patient-uploads').createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;

      const { error } = await supabase.from('test_results').insert({
        test_id: test.id,
        user_id: user.id,
        result_file_url: signed.signedUrl,
        result_data: { source: 'patient_upload', lab_name: labName, test_date: testDate, notes, file_name: file.name, storage_path: path },
        ai_remarks: 'Uploaded by patient from an external lab. Awaiting doctor review.',
      });
      if (error) throw error;

      toast({ title: 'Report uploaded', description: 'Your doctor will review the result.' });
      setOpen(false);
      setFile(null); setLabName(''); setTestDate(''); setNotes('');
      onUploaded();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" />Upload my report</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload test report</DialogTitle>
          <DialogDescription>Done "{test.test_name}" at another lab? Upload the report here (PDF or image).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Report file</Label>
            <Input type="file" required accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lab name</Label>
              <Input required maxLength={120} value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Chughtai Lab" />
            </div>
            <div className="space-y-2">
              <Label>Test date</Label>
              <Input type="date" required max={new Date().toISOString().slice(0, 10)} value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !file}>{saving ? 'Uploading...' : 'Upload report'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
