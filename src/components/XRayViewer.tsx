import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

export default function XRayViewer({ url, anomalies }: { url: string; anomalies: any }) {
  const [show, setShow] = useState(true);
  const list = Array.isArray(anomalies) ? anomalies : [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-sm">
        <Switch checked={show} onCheckedChange={setShow} id={`hl-${url}`} />
        <label htmlFor={`hl-${url}`}>Show AI highlight</label>
      </div>
      <div className="relative mx-auto w-fit rounded-lg overflow-hidden border border-border bg-foreground">
        <img src={url} alt="X-ray result" className="block max-h-[28rem] w-auto" loading="lazy" />
        {show && list.map((a: any, i: number) => a.coordinates && (
          <div key={i} className="absolute border-2 border-destructive bg-destructive/20 rounded animate-pulse"
            style={{ left: `${a.coordinates.x}%`, top: `${a.coordinates.y}%`, width: `${a.coordinates.width}%`, height: `${a.coordinates.height}%` }}>
            <span className="absolute -top-6 left-0 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap">{a.description}</span>
          </div>
        ))}
      </div>
      {list.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold"><AlertCircle className="w-4 h-4 text-destructive" />Issues detected by AI</p>
          {list.map((a: any, i: number) => (
            <div key={i} className="p-3 bg-accent rounded-lg flex justify-between items-start gap-2">
              <div>
                <p className="text-sm font-medium">{a.description}</p>
                <p className="text-xs text-muted-foreground">Location: {a.location}{a.confidence ? ` · Confidence ${Math.round(a.confidence * 100)}%` : ''}</p>
              </div>
              <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
