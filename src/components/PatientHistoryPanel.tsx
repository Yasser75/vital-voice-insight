import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ChevronDown, ChevronRight, TestTube, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Shows a patient's previous consultations and their tests/results for the doctor. */
export default function PatientHistoryPanel({ patientUserId, patientName }: { patientUserId: string; patientName?: string }) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = !q ? visits : visits.filter((v) => [
    new Date(v.consultation_date).toLocaleDateString(), v.diagnosis, ...(v.symptoms || []),
    ...(v.medical_tests || []).flatMap((t: any) => [t.test_name, t.test_type, t.status, ...(t.test_results || []).flatMap((r: any) => [r.doctor_remarks, r.ai_remarks, r.ai_analysis])]),
  ].filter(Boolean).join(' ').toLowerCase().includes(q));

  useEffect(() => {
    (async () => {
      const { data: pts } = await supabase.from('patients').select('id').eq('user_id', patientUserId);
      const ids = (pts || []).map((p) => p.id);
      if (!ids.length) { setVisits([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('consultations')
        .select('id, consultation_date, diagnosis, symptoms, ai_confidence, medical_tests(id, test_name, test_type, status, scheduled_date, test_results(ai_remarks, ai_analysis, doctor_remarks))')
        .in('patient_id', ids)
        .order('consultation_date', { ascending: false })
        .limit(20);
      if (error) console.error('History load error', error);
      setVisits(data || []);
      setLoading(false);
    })();
  }, [patientUserId]);

  const summary = (text?: string | null) => {
    if (!text) return 'No diagnosis recorded';
    const plain = text.replace(/\*\*/g, '').replace(/#+/g, '');
    return plain.length > 220 ? plain.slice(0, 220) + '…' : plain;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" />Patient History{patientName ? ` — ${patientName}` : ''}</CardTitle>
        <CardDescription>Previous consultations, diagnoses and test results</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No previous visits on record.</p>
        ) : (
          <>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search past visits: symptom, diagnosis, test, date..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No visits match "{query}".</p>}
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {filtered.map((v) => {
              const open = openId === v.id;
              const tests = v.medical_tests || [];
              return (
                <div key={v.id} className="py-3">
                  <button type="button" className="w-full text-left flex items-start gap-2" onClick={() => setOpenId(open ? null : v.id)}>
                    {open ? <ChevronDown className="w-4 h-4 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{new Date(v.consultation_date).toLocaleDateString()}</span>
                        <Badge variant="secondary">{tests.length} test{tests.length === 1 ? '' : 's'}</Badge>
                      </div>
                      {!open && <p className="text-sm text-muted-foreground line-clamp-2">{summary(v.diagnosis)}</p>}
                    </div>
                  </button>
                  {open && (
                    <div className="mt-2 ml-6 space-y-3">
                      {v.symptoms?.length > 0 && (
                        <div className="flex flex-wrap gap-1">{v.symptoms.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{v.diagnosis?.replace(/\*\*/g, '') || 'No diagnosis recorded'}</p>
                      {tests.map((t: any) => {
                        const r = t.test_results?.[0];
                        return (
                          <div key={t.id} className="rounded-md border border-border p-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 font-medium"><TestTube className="w-3 h-3" />{t.test_name}</span>
                              <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{t.status}</Badge>
                            </div>
                            {r && <p className="text-muted-foreground mt-1">{r.doctor_remarks || r.ai_remarks || r.ai_analysis?.slice(0, 200)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
