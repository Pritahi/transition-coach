'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Zap, Clock } from 'lucide-react';
import { useStore, createAlarmData } from '@/store/useStore';
import { alarmTemplates, type AlarmTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';


interface StepInput {
  label: string;
  minutesBefore: number;
}

export default function CreateAlarmSheet() {
  const { showCreateAlarm, setShowCreateAlarm, addAlarm } = useStore();
  const [title, setTitle] = useState('');
  const [finalTime, setFinalTime] = useState('');
  const [steps, setSteps] = useState<StepInput[]>([
    { label: '', minutesBefore: 20 },
    { label: '', minutesBefore: 10 },
    { label: '', minutesBefore: 0 },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setFinalTime('');
    setSteps([
      { label: '', minutesBefore: 20 },
      { label: '', minutesBefore: 10 },
      { label: '', minutesBefore: 0 },
    ]);
    setSelectedTemplate(null);
    setError('');
  };

  const handleTemplateSelect = (template: AlarmTemplate) => {
    setSelectedTemplate(template.id);
    setTitle(template.name);
    setSteps(template.steps.map((s) => ({ ...s })));
    // Set default time to 1 hour from now
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    oneHourLater.setMinutes(0, 0, 0);
    setFinalTime(
      `${oneHourLater.getFullYear()}-${String(oneHourLater.getMonth() + 1).padStart(2, '0')}-${String(oneHourLater.getDate()).padStart(2, '0')}T${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`
    );
  };

  const addStep = () => {
    if (steps.length >= 5) return;
    const lastMinutes = steps[steps.length - 1]?.minutesBefore ?? 10;
    setSteps([
      ...steps,
      { label: '', minutesBefore: Math.max(0, lastMinutes - 10) },
    ]);
    setSelectedTemplate(null);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
    setSelectedTemplate(null);
  };

  const updateStep = (index: number, field: keyof StepInput, value: string | number) => {
    const newSteps = [...steps];
    if (field === 'minutesBefore') {
      newSteps[index] = { ...newSteps[index], [field]: Math.max(0, Number(value)) };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    setSteps(newSteps);
    setSelectedTemplate(null);
  };

  const handleSubmit = () => {
    setError('');

    if (!title.trim()) {
      setError('Please enter an alarm title');
      return;
    }
    if (!finalTime) {
      setError('Please set the final time');
      return;
    }
    const filledSteps = steps.filter((s) => s.label.trim());
    if (filledSteps.length === 0) {
      setError('Please add at least one step');
      return;
    }

    const alarm = createAlarmData(
      title.trim(),
      finalTime,
      filledSteps.map((s) => ({ label: s.label.trim(), minutesBefore: s.minutesBefore }))
    );

    addAlarm(alarm);
    resetForm();
    setShowCreateAlarm(false);
  };

  const isValid = title.trim() && finalTime && steps.some((s) => s.label.trim());

  return (
    <Sheet open={showCreateAlarm} onOpenChange={(open) => { if (!open) { setShowCreateAlarm(false); resetForm(); }}}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl px-0 flex flex-col [&>button:last-child]:hidden">
        <SheetHeader className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">Create Alarm</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Break your task into simple steps
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowCreateAlarm(false); resetForm(); }}
              className="rounded-full h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="space-y-5">
            {/* Templates */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 block">Templates</Label>
              <div className="grid grid-cols-3 gap-2">
                {alarmTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/50 bg-card active:bg-secondary'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{template.emoji}</span>
                    <span className="text-xs font-medium block">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="alarm-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </Label>
              <Input
                id="alarm-title"
                placeholder="e.g., Leave for College"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSelectedTemplate(null); }}
                className="mt-1.5 h-11 rounded-xl bg-secondary border-0"
              />
            </div>

            {/* Final Time */}
            <div>
              <Label htmlFor="alarm-time" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Deadline
              </Label>
              <Input
                id="alarm-time"
                type="datetime-local"
                value={finalTime}
                onChange={(e) => setFinalTime(e.target.value)}
                className="mt-1.5 h-11 rounded-xl bg-secondary border-0"
              />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Steps</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{steps.length}/5</span>
                  {steps.length < 5 && (
                    <Button variant="ghost" size="sm" onClick={addStep} className="h-7 w-7 p-0 rounded-full">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-2.5"
                    >
                      <div className="flex flex-col items-center pt-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-0.5 h-6 bg-border mt-1" />
                        )}
                      </div>

                      <div className="flex-1 bg-card rounded-2xl border border-border/50 p-3 space-y-2">
                        <Input
                          placeholder={`Step ${index + 1} action`}
                          value={step.label}
                          onChange={(e) => updateStep(index, 'label', e.target.value)}
                          className="h-10 rounded-xl bg-secondary border-0"
                        />
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          {index < steps.length - 1 ? (
                            <>
                              <Input
                                type="number"
                                min={0}
                                value={step.minutesBefore}
                                onChange={(e) => updateStep(index, 'minutesBefore', e.target.value)}
                                className="h-8 w-16 text-sm rounded-lg bg-secondary border-0"
                              />
                              <span className="text-xs text-muted-foreground">min before</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">At deadline</span>
                          )}
                          {steps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(index)}
                              className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive rounded-full"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border/50 bg-background">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-12 rounded-2xl text-base font-semibold disabled:opacity-40"
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Alarm
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
