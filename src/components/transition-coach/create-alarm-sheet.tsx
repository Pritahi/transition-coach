'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Zap, Clock, Bookmark, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import { useStore, createAlarmData, type CustomTemplate, type AlarmHistoryEntry } from '@/store/useStore';
import { alarmTemplates, type AlarmTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// iOS-style red dot indicator
function RedDot({ show }: { show: boolean }) {
  return (
    <motion.span
      animate={show ? { scale: [1, 1.3, 1] } : { scale: 0 }}
      transition={{ duration: 0.3 }}
      className="inline-flex ml-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
    />
  );
}

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {children}
      {required !== false && <RedDot show={true} />}
    </label>
  );
}

const templateEmojis = ['📌', '🎯', '⚡', '🔥', '✨', '🚀', '💡', '⭐', '📝', '🏋️', '🎓', '💼'];

export default function CreateAlarmSheet() {
  const {
    showCreateAlarm, setShowCreateAlarm, addAlarm,
    customTemplates, addCustomTemplate, deleteCustomTemplate, incrementTemplateUsage,
    alarmHistory,
  } = useStore();

  const [title, setTitle] = useState('');
  const [finalTime, setFinalTime] = useState('');
  const [steps, setSteps] = useState<StepInput[]>([
    { label: '', minutesBefore: 20 },
    { label: '', minutesBefore: 10 },
    { label: '', minutesBefore: 0 },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateEmoji, setTemplateEmoji] = useState('📌');
  const [activeTab, setActiveTab] = useState<'quick' | 'my' | 'history'>('quick');
  const scrollRef = useRef<HTMLDivElement>(null);

  const titleMissing = submitted && !title.trim();
  const timeMissing = submitted && !finalTime;
  const hasEmptySteps = submitted && !steps.some((s) => s.label.trim());

  const resetForm = () => {
    setTitle('');
    setFinalTime('');
    setSteps([
      { label: '', minutesBefore: 20 },
      { label: '', minutesBefore: 10 },
      { label: '', minutesBefore: 0 },
    ]);
    setSelectedTemplate(null);
    setSubmitted(false);
    setShowSaveTemplate(false);
    setTemplateName('');
    setActiveTab('quick');
  };

  const getTimeOneHourFromNow = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleTemplateSelect = (template: { name: string; steps: { label: string; minutesBefore: number }[]; id?: string }) => {
    if (template.id) {
      setSelectedTemplate(`custom-${template.id}`);
      incrementTemplateUsage(template.id);
    } else {
      setSelectedTemplate(`builtin-${template.name}`);
    }
    setTitle(template.name);
    setSteps(template.steps.map((s) => ({ ...s })));
    setFinalTime(getTimeOneHourFromNow());
  };

  const handleHistoryReuse = (entry: AlarmHistoryEntry) => {
    setSelectedTemplate(`history-${entry.id}`);
    setTitle(entry.title);
    setSteps(entry.steps.map((s) => ({ ...s })));
    setFinalTime(getTimeOneHourFromNow());
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

  const updateStep = useCallback((index: number, field: keyof StepInput, value: string | number) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      if (field === 'minutesBefore') {
        newSteps[index] = { ...newSteps[index], [field]: Math.max(0, Number(value)) };
      } else {
        newSteps[index] = { ...newSteps[index], [field]: value };
      }
      return newSteps;
    });
    setSelectedTemplate(null);
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!title.trim() || !finalTime || !steps.some((s) => s.label.trim())) return;

    const alarm = createAlarmData(
      title.trim(),
      finalTime,
      steps.filter((s) => s.label.trim()).map((s) => ({ label: s.label.trim(), minutesBefore: s.minutesBefore }))
    );
    addAlarm(alarm);
    resetForm();
    setShowCreateAlarm(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !steps.some((s) => s.label.trim())) return;
    addCustomTemplate({
      name: templateName.trim(),
      emoji: templateEmoji,
      steps: steps.filter((s) => s.label.trim()).map((s) => ({ label: s.label.trim(), minutesBefore: s.minutesBefore })),
    });
    setShowSaveTemplate(false);
    setTemplateName('');
  };

  const isValid = title.trim() && finalTime && steps.some((s) => s.label.trim());
  const filledSteps = steps.filter((s) => s.label.trim());

  return (
    <Sheet open={showCreateAlarm} onOpenChange={(open) => {
      if (!open) { setShowCreateAlarm(false); resetForm(); }
    }}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[88vh] sm:max-w-lg sm:mx-auto rounded-t-[2rem] px-0 pb-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* iOS drag handle */}
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Fixed Header */}
          <SheetHeader className="px-5 pt-1 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-[17px] font-bold tracking-tight">
                  New Alarm
                </SheetTitle>
                <SheetDescription className="text-[13px] mt-0.5 text-muted-foreground">
                  Add steps with deadlines
                </SheetDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {isValid && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => setShowSaveTemplate(true)}
                    className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center active:scale-90 transition-transform"
                    title="Save as template"
                  >
                    <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </motion.button>
                )}
                <button
                  onClick={() => { setShowCreateAlarm(false); resetForm(); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            <div className="space-y-4">
              {/* Template Tabs */}
              <div>
                <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg mb-2.5">
                  {([
                    { id: 'quick' as const, label: 'Quick Start' },
                    { id: 'my' as const, label: `My Templates` },
                    { id: 'history' as const, label: 'History' },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* Quick Start — Built-in templates */}
                  {activeTab === 'quick' && (
                    <motion.div
                      key="quick"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                        {alarmTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all active:scale-[0.97] ${
                              selectedTemplate === `builtin-${template.name}`
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                : 'border-border bg-background hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-lg">{template.emoji}</span>
                            <span className="text-[13px] font-medium whitespace-nowrap">{template.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* My Templates — Custom saved */}
                  {activeTab === 'my' && (
                    <motion.div
                      key="my"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {customTemplates.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                            <Bookmark className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-[13px] text-muted-foreground">No saved templates yet</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Create an alarm and tap the bookmark icon to save
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {customTemplates.map((template) => (
                            <div
                              key={template.id}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                selectedTemplate === `custom-${template.id}`
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'border-border bg-background'
                              }`}
                            >
                              <button
                                onClick={() => handleTemplateSelect(template)}
                                className="flex-1 flex items-center gap-2.5 text-left"
                              >
                                <span className="text-lg">{template.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate">{template.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {template.steps.length} steps · used {template.usageCount}x
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                              </button>
                              <button
                                onClick={() => deleteCustomTemplate(template.id)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* History — Reuse past alarms */}
                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {alarmHistory.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                            <RotateCcw className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-[13px] text-muted-foreground">No history yet</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Completed and deleted alarms will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {alarmHistory.slice(0, 10).map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => handleHistoryReuse(entry)}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                                selectedTemplate === `history-${entry.id}`
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'border-border bg-background'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[13px] font-medium truncate">{entry.title}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {entry.completedSteps}/{entry.totalSteps} done · {entry.steps.length} steps
                                </p>
                              </div>
                              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                                {new Date(entry.completedAt).toLocaleDateString()}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-border/60" />

              {/* Title */}
              <div>
                <div className="flex items-center mb-1.5">
                  <SectionLabel required>Alarm Name</SectionLabel>
                  {titleMissing && (
                    <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] text-red-500 font-medium ml-auto">Required</motion.span>
                  )}
                </div>
                <Input
                  placeholder="e.g., Leave for College"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setSelectedTemplate(null); setSubmitted(false); }}
                  className={`h-11 rounded-xl text-[15px] bg-muted/40 border-border/60 focus:border-emerald-500 focus:ring-emerald-500/20 ${titleMissing ? 'border-red-400' : ''}`}
                />
              </div>

              {/* Time */}
              <div>
                <div className="flex items-center mb-1.5">
                  <SectionLabel required>Deadline</SectionLabel>
                  {timeMissing && (
                    <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] text-red-500 font-medium ml-auto">Required</motion.span>
                  )}
                </div>
                <Input
                  type="datetime-local"
                  value={finalTime}
                  onChange={(e) => { setFinalTime(e.target.value); setSubmitted(false); }}
                  className={`h-11 rounded-xl text-[15px] bg-muted/40 border-border/60 focus:border-emerald-500 focus:ring-emerald-500/20 ${timeMissing ? 'border-red-400' : ''}`}
                />
              </div>

              <div className="h-px bg-border/60" />

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <SectionLabel required>Steps</SectionLabel>
                    <span className="text-[12px] text-muted-foreground/60 font-normal normal-case tracking-normal ml-1.5">
                      {filledSteps.length} filled
                    </span>
                  </div>
                  {steps.length < 5 && (
                    <button onClick={addStep}
                      className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>

                {hasEmptySteps && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-red-500 font-medium mb-2">Add at least one step</motion.p>
                )}

                <div className="space-y-2.5">
                  <AnimatePresence>
                    {steps.map((step, index) => {
                      const isLast = index === steps.length - 1;
                      const isEmpty = submitted && !step.label.trim() && filledSteps.length === 0;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <div className={`rounded-2xl border p-3.5 transition-colors ${isEmpty ? 'border-red-300 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10' : 'border-border/60 bg-background'}`}>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.label.trim() ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}>
                                  <span className={`text-[11px] font-bold ${step.label.trim() ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                    {step.label.trim() ? '✓' : index + 1}
                                  </span>
                                </div>
                                <span className="text-[13px] font-semibold text-foreground">
                                  {isLast ? 'Final Step' : `Step ${index + 1}`}
                                </span>
                                {step.label.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              </div>
                              {steps.length > 1 && (
                                <button onClick={() => removeStep(index)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all">
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <Input
                              placeholder="What to do?"
                              value={step.label}
                              onChange={(e) => updateStep(index, 'label', e.target.value)}
                              className={`h-10 rounded-xl text-[14px] bg-muted/30 border-transparent focus:border-emerald-500/50 focus:bg-background ${isEmpty ? 'border-red-300 dark:border-red-800/50' : ''}`}
                            />

                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                              {isLast ? (
                                <span className="text-[12px] text-muted-foreground font-medium">At the deadline</span>
                              ) : (
                                <>
                                  <span className="text-[12px] text-muted-foreground">{step.minutesBefore} min before</span>
                                  <div className="flex items-center gap-1 ml-auto">
                                    {[5, 10, 15, 20, 30].map((m) => (
                                      <button key={m} onClick={() => updateStep(index, 'minutesBefore', m)}
                                        className={`w-7 h-6 rounded-md text-[11px] font-medium transition-all active:scale-90 ${step.minutesBefore === m ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                                        {m}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {!isLast && (
                            <div className="flex justify-center py-0.5">
                              <div className="w-0.5 h-2.5 bg-border/40 rounded-full" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <div className="h-2" />
            </div>
          </div>

          {/* Save Template Dialog */}
          <AnimatePresence>
            {showSaveTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-shrink-0 border-t border-border/60 bg-amber-50 dark:bg-amber-900/10 px-5 py-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[13px] font-semibold text-amber-900 dark:text-amber-100">Save as Template</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {templateEmojis.map((e) => (
                      <button key={e} onClick={() => setTemplateEmoji(e)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center flex-shrink-0 transition-all ${templateEmoji === e ? 'bg-amber-200 dark:bg-amber-800/40 scale-110' : 'bg-background hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 flex gap-1.5">
                    <Input
                      placeholder="Template name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="h-9 rounded-lg text-[13px] bg-background"
                    />
                    <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}
                      className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg disabled:opacity-30">
                      Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fixed Bottom — Create Button */}
          <div className="flex-shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-xl px-5 pt-3 pb-6 sm:pb-5 safe-area-inset-bottom">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full h-[52px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[16px] font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Alarm
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
