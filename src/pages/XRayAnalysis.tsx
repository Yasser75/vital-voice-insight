import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

export default function XRayAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysis(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an X-ray image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke('analyze-xray', {
          body: { 
            imageBase64: base64Image,
            testType: 'X-ray'
          }
        });

        if (error) throw error;

        setAnalysis(data.analysis);
        
        toast({
          title: "Analysis Complete",
          description: "X-ray analyzed successfully",
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze X-ray",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            X-Ray Analysis
          </h1>
          <p className="text-muted-foreground">
            Upload medical imaging for AI-powered anomaly detection
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload X-Ray
              </CardTitle>
              <CardDescription>
                Select an X-ray or medical imaging file for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="xray-upload"
                />
                <label
                  htmlFor="xray-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload X-ray image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, or DICOM</span>
                </label>
              </div>

              {previewUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                    <img
                      src={previewUrl}
                      alt="X-ray preview"
                      className="w-full h-auto"
                    />
                    
                    {analysis?.anomalies?.map((anomaly: any, index: number) => (
                      <div
                        key={index}
                        className="absolute border-2 border-red-500 bg-red-500/20"
                        style={{
                          left: `${anomaly.coordinates?.x || 0}%`,
                          top: `${anomaly.coordinates?.y || 0}%`,
                          width: `${anomaly.coordinates?.width || 10}%`,
                          height: `${anomaly.coordinates?.height || 10}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {anomaly.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze X-Ray with AI'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-secondary" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-detected anomalies and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-6">
                  {/* Findings */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                      Findings
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {analysis.findings}
                    </p>
                  </div>

                  {/* Anomalies */}
                  {analysis.anomalies && analysis.anomalies.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                        Detected Anomalies
                      </h3>
                      {analysis.anomalies.map((anomaly: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-accent rounded-lg border border-border space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">{anomaly.description}</p>
                            <Badge
                              variant={
                                anomaly.severity === 'high'
                                  ? 'destructive'
                                  : anomaly.severity === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Location: {anomaly.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                      Recommendations
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {analysis.recommendations}
                    </p>
                  </div>

                  <Button variant="secondary" className="w-full">
                    Generate Report
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Upload an X-ray image and click "Analyze" to see AI-powered results
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