import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestScheduleDialogProps {
  consultationId: string;
  recommendedTest?: string;
  /** Tests ticked from the AI recommendation list */
  selectedTests?: string[];
  /** Patient account the tests belong to */
  patientUserId?: string;
  onScheduled?: () => void;
}

// Guess the test category and department from the test name
export const classifyTest = (name: string) => {
  const n = name.toLowerCase();
  if (/x-?ray|radiograph/.test(n)) return { type: 'xray', department: 'radiology' };
  if (/\bct\b|computed tomography/.test(n)) return { type: 'ct', department: 'radiology' };
  if (/mri|magnetic/.test(n)) return { type: 'mri', department: 'radiology' };
  if (/ultrasound|sonograph|echo/.test(n)) return { type: 'ultrasound', department: 'radiology' };
  if (/ecg|ekg|electrocardio|troponin|stress test|holter/.test(n)) return { type: 'ecg', department: 'cardiology' };
  if (/urine|urinalysis/.test(n)) return { type: 'urine', department: 'lab' };
  if (/blood|cbc|count|lipid|thyroid|tsh|glucose|hba1c|d-dimer|crp|esr|panel|culture|enzyme|marker|vitamin|iron|liver|kidney|electrolyte/.test(n))
    return { type: 'blood', department: 'pathology' };
  return { type: 'other', department: 'lab' };
};

export default function TestScheduleDialog({
  consultationId,
  recommendedTest,
  selectedTests = [],
  patientUserId,
  onScheduled,
}: TestScheduleDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const multi = selectedTests.length > 0;

  const [formData, setFormData] = useState({
    testType: '',
    testName: recommendedTest || '',
    department: '',
    scheduledTime: '',
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    if (open && selectedTests.length === 1) {
      const c = classifyTest(selectedTests[0]);
      setFormData((f) => ({ ...f, testName: selectedTests[0], testType: c.type, department: c.department }));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const base = {
        consultation_id: consultationId,
        user_id: patientUserId || user.id,
        scheduled_date: date?.toISOString(),
        scheduled_time: formData.scheduledTime,
        priority: formData.priority,
        notes: formData.notes,
        status: 'pending',
      };

      const rows = multi && selectedTests.length > 1
        ? selectedTests.map((name) => {
            const c = classifyTest(name);
            return { ...base, test_name: name, test_type: c.type, department: c.department };
          })
        : [{ ...base, test_name: formData.testName, test_type: formData.testType || 'other', department: formData.department || 'lab' }];

      const { error } = await supabase.from('medical_tests').insert(rows);
      if (error) throw error;

      toast({
        title: t('common.success'),
        description: rows.length > 1 ? `${rows.length} tests scheduled successfully` : 'Test scheduled successfully',
      });
      setOpen(false);
      onScheduled?.();
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

  const showSingleFields = !(multi && selectedTests.length > 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          {multi ? `Schedule ${selectedTests.length} selected test${selectedTests.length > 1 ? 's' : ''}` : t('consultation.scheduleButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('testScheduling.title')}</DialogTitle>
          <DialogDescription>Schedule medical tests for the patient</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!showSingleFields && (
            <div className="space-y-2">
              <Label>Scheduled tests</Label>
              <div className="rounded-md border border-border divide-y divide-border">
                {selectedTests.map((name) => {
                  const c = classifyTest(name);
                  return (
                    <div key={name} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{name}</span>
                      <Badge variant="secondary" className="capitalize">{c.department}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showSingleFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('testScheduling.testType')}</Label>
                  <Select value={formData.testType} onValueChange={(value) => setFormData({ ...formData, testType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood">{t('testScheduling.testTypes.blood')}</SelectItem>
                      <SelectItem value="urine">{t('testScheduling.testTypes.urine')}</SelectItem>
                      <SelectItem value="xray">{t('testScheduling.testTypes.xray')}</SelectItem>
                      <SelectItem value="ct">{t('testScheduling.testTypes.ct')}</SelectItem>
                      <SelectItem value="mri">{t('testScheduling.testTypes.mri')}</SelectItem>
                      <SelectItem value="ultrasound">{t('testScheduling.testTypes.ultrasound')}</SelectItem>
                      <SelectItem value="ecg">{t('testScheduling.testTypes.ecg')}</SelectItem>
                      <SelectItem value="other">{t('testScheduling.testTypes.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('testScheduling.department')}</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab">{t('testScheduling.departments.lab')}</SelectItem>
                      <SelectItem value="radiology">{t('testScheduling.departments.radiology')}</SelectItem>
                      <SelectItem value="cardiology">{t('testScheduling.departments.cardiology')}</SelectItem>
                      <SelectItem value="pathology">{t('testScheduling.departments.pathology')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('testScheduling.testName')}</Label>
                <Input value={formData.testName} onChange={(e) => setFormData({ ...formData, testName: e.target.value })} required />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('testScheduling.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t('testScheduling.time')}</Label>
              <Input type="time" value={formData.scheduledTime} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('testScheduling.priority')}</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('testScheduling.priorities.normal')}</SelectItem>
                <SelectItem value="urgent">{t('testScheduling.priorities.urgent')}</SelectItem>
                <SelectItem value="emergency">{t('testScheduling.priorities.emergency')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('testScheduling.notes')}</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !date} className="flex-1">
              {loading ? t('common.loading') : t('common.submit')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
