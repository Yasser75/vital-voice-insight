import { useState } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TestScheduleDialogProps {
  consultationId: string;
  recommendedTest?: string;
}

export default function TestScheduleDialog({ 
  consultationId, 
  recommendedTest 
}: TestScheduleDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    testType: '',
    testName: recommendedTest || '',
    department: '',
    scheduledTime: '',
    priority: 'normal',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('medical_tests').insert({
        consultation_id: consultationId,
        user_id: user.id,
        test_type: formData.testType,
        test_name: formData.testName,
        department: formData.department,
        scheduled_date: date?.toISOString(),
        scheduled_time: formData.scheduledTime,
        priority: formData.priority,
        notes: formData.notes,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Test scheduled successfully',
      });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">{t('consultation.scheduleButton')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('testScheduling.title')}</DialogTitle>
          <DialogDescription>
            Schedule a medical test for the patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('testScheduling.testType')}</Label>
              <Select
                value={formData.testType}
                onValueChange={(value) =>
                  setFormData({ ...formData, testType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            <Input
              value={formData.testName}
              onChange={(e) =>
                setFormData({ ...formData, testName: e.target.value })
              }
              required
            />
          </div>

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
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('testScheduling.time')}</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('testScheduling.priority')}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('testScheduling.priorities.normal')}</SelectItem>
                <SelectItem value="urgent">{t('testScheduling.priorities.urgent')}</SelectItem>
                <SelectItem value="emergency">{t('testScheduling.priorities.emergency')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('testScheduling.notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : t('common.submit')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
