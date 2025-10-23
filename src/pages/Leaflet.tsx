import { Card } from "@/components/ui/card";
import { Activity, Brain, Stethoscope, Image, Users, ClipboardList, BarChart3, Shield } from "lucide-react";

const Leaflet = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page 1 - Front Cover & Introduction */}
        <Card className="p-12 bg-card shadow-2xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Activity className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Health Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced Medical Diagnosis and Analysis Platform
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-8" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI-Powered Diagnosis</h3>
                  <p className="text-muted-foreground">
                    Leverage cutting-edge artificial intelligence to analyze patient symptoms and provide accurate diagnostic suggestions with confidence scoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Medical Imaging Analysis</h3>
                  <p className="text-muted-foreground">
                    Advanced X-ray analysis with AI-powered anomaly detection, highlighting areas of concern for healthcare professionals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Voice-to-Text Consultation</h3>
                  <p className="text-muted-foreground">
                    Real-time transcription of patient consultations, streamlining documentation and improving healthcare efficiency.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Test Management</h3>
                  <p className="text-muted-foreground">
                    Seamless scheduling and tracking of medical tests with priority-based workflows for urgent cases.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Administrative Dashboard</h3>
                  <p className="text-muted-foreground">
                    Comprehensive analytics and reporting with real-time insights into hospital operations and patient flow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Multi-Role Access</h3>
                  <p className="text-muted-foreground">
                    Tailored interfaces for doctors, patients, laboratory staff, and administrators with role-based permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Page 2 - Features & Benefits */}
        <Card className="p-12 bg-card shadow-2xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Transforming Healthcare Delivery
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl">For Doctors</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Voice-recorded patient consultations</li>
                <li>• AI-assisted diagnosis suggestions</li>
                <li>• Automated test recommendations</li>
                <li>• Quick access to patient history</li>
                <li>• Streamlined documentation</li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl">For Patients</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• View consultation history</li>
                <li>• Access test results instantly</li>
                <li>• Track upcoming appointments</li>
                <li>• Review diagnoses and treatments</li>
                <li>• Secure health records management</li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl">For Laboratory</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• View scheduled tests</li>
                <li>• Update test results efficiently</li>
                <li>• Priority-based workflows</li>
                <li>• Real-time status updates</li>
                <li>• Integrated reporting system</li>
              </ul>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              Key Benefits
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Enhanced diagnostic accuracy with AI support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Reduced consultation documentation time</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Improved patient care coordination</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Streamlined test management workflow</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Real-time analytics and reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Multi-language support for accessibility</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Secure, role-based access control</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Comprehensive audit trail</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground italic">
              "This system is designed to assist healthcare professionals and should not replace professional medical judgment. Always consult with qualified healthcare providers for final diagnosis and treatment decisions."
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 AI Health Assistant. All rights reserved.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Leaflet;
