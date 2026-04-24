'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Zap, Clock, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">Create Smart Alarm</SheetTitle>
              <SheetDescription className="text-sm mt-1">
                Convert your chaos into a clear, step-by-step flow
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowCreateAlarm(false); resetForm(); }}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {/* Templates */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Templates</Label>
              <div className="grid grid-cols-3 gap-2">
                {alarmTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedTemplate === template.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
                        : 'border-border hover:border-emerald-300 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl block mb-1">{template.emoji}</span>
                    <span className="text-xs font-medium block">{template.name}</span>
                    <span className="text-[10px] text-muted-foreground block">{template.steps.length} steps</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="alarm-title" className="text-sm font-medium">
                Alarm Title
              </Label>
              <Input
                id="alarm-title"
                placeholder="e.g., Leave for College"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSelectedTemplate(null); }}
                className="mt-1.5"
              />
            </div>

            {/* Final Time */}
            <div>
              <Label htmlFor="alarm-time" className="text-sm font-medium">
                Final Time (deadline)
              </Label>
              <Input
                id="alarm-time"
                type="datetime-local"
                value={finalTime}
                onChange={(e) => setFinalTime(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Steps</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {steps.length}/5
                  </Badge>
                  {steps.length < 5 && (
                    <Button variant="ghost" size="sm" onClick={addStep} className="h-7 px-2">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-2"
                    >
                      <div className="flex flex-col items-center mt-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-600">
                            {index + 1}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-emerald-200 dark:bg-emerald-800/40 mt-1" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 bg-muted/30 rounded-lg p-3">
                        <Input
                          placeholder={`Step ${index + 1} action`}
                          value={step.label}
                          onChange={(e) => updateStep(index, 'label', e.target.value)}
                          className="h-9 bg-background"
                        />
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {index === steps.length - 1 ? 'At deadline' : 'Minutes before'}
                          </span>
                          {index < steps.length - 1 ? (
                            <Input
                              type="number"
                              min={0}
                              value={step.minutesBefore}
                              onChange={(e) => updateStep(index, 'minutesBefore', e.target.value)}
                              className="h-8 w-20 text-sm bg-background"
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Final
                            </Badge>
                          )}
                          {steps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(index)}
                              className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
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

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold rounded-xl disabled:opacity-40"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Smart Alarm
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
