import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Upload, BarChart3 } from 'lucide-react';
import Dashboard from './Dashboard';

type AppStep = 'upload' | 'dashboard';

const MainApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [filesUploaded, setFilesUploaded] = useState(false);

  const steps = [
    {
      id: 'upload',
      title: 'Upload Data',
      description: 'Upload your portfolio data files',
      icon: Upload,
      completed: filesUploaded,
    },
    {
      id: 'dashboard',
      title: 'Analysis Dashboard',
      description: 'View comprehensive portfolio analysis',
      icon: CheckCircle,
      completed: false,
    },
  ];

  const handleFilesUploaded = () => {
    setFilesUploaded(true);
    setCurrentStep('dashboard');
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const canProceedToNext = () => {
    return currentStep === 'upload' && filesUploaded;
  };

  const handleNext = () => {
    if (currentStep === 'upload' && filesUploaded) {
      setCurrentStep('dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep === 'dashboard') {
      setCurrentStep('upload');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUploadZone
            onAllFilesUploaded={handleFilesUploaded}
          />
        );
      case 'dashboard':
        return <Dashboard />;
      default:
        return null;
    }
  };

  if (currentStep === 'dashboard') {
    return <Dashboard />;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Progress Stepper */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Analysis</CardTitle>
            <CardDescription>
              Upload your data files and view comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = step.completed;
                const isPast = getCurrentStepIndex() > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isCompleted || isPast
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isActive
                            ? 'border-primary text-primary'
                            : 'border-muted-foreground/25 text-muted-foreground'
                        }`}
                      >
                        {isCompleted || isPast ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground max-w-24">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-muted-foreground/25 mx-4 mb-8" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'upload'}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
              >
                {currentStep === 'upload' ? 'Start Analysis' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </MainLayout>
  );
};

export default MainApp;
