'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bug, Lightbulb, Heart, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getAnonymousId } from '@/lib/analytics';

const feedbackTypes = [
  {
    id: 'bug',
    label: 'Bug Report',
    emoji: '🐛',
    icon: Bug,
    color: 'border-red-200 bg-red-50 text-red-600',
    selectedColor: 'border-red-400 bg-red-50 ring-2 ring-red-200',
    placeholder: 'Kya problem aa rhi hai? Kahan dikha?',
  },
  {
    id: 'feature',
    label: 'Feature Idea',
    emoji: '💡',
    icon: Lightbulb,
    color: 'border-amber-200 bg-amber-50 text-amber-600',
    selectedColor: 'border-amber-400 bg-amber-50 ring-2 ring-amber-200',
    placeholder: 'Kya naya feature chahiye? Kaise kaam karega?',
  },
  {
    id: 'love',
    label: 'Love It!',
    emoji: '❤️',
    icon: Heart,
    color: 'border-pink-200 bg-pink-50 text-pink-600',
    selectedColor: 'border-pink-400 bg-pink-50 ring-2 ring-pink-200',
    placeholder: 'Kya acha laga? Kaise help kiya?',
  },
  {
    id: 'other',
    label: 'Other',
    emoji: '💬',
    icon: MessageCircle,
    color: 'border-gray-200 bg-gray-50 text-gray-600',
    selectedColor: 'border-gray-400 bg-gray-50 ring-2 ring-gray-200',
    placeholder: 'Kuch bhi bolo... hum sun rahe hain',
  },
];

export default function FeedbackSheet() {
  const { showFeedbackSheet, setShowFeedbackSheet } = useStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !message.trim()) return;

    setSending(true);
    try {
      const anonymousId = getAnonymousId();
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
          anonymousId: anonymousId || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowFeedbackSheet(false);
          // Reset after close animation
          setTimeout(() => {
            setSubmitted(false);
            setSelectedType(null);
            setMessage('');
          }, 300);
        }, 1800);
      }
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setShowFeedbackSheet(false);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedType(null);
      setMessage('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {showFeedbackSheet && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold">Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  {submitted ? 'Thank you!' : 'Batao kya sochte ho'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {submitted ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-1">Thanks!</h3>
                  <p className="text-sm text-muted-foreground">
                    Tumhara feedback mil gaya. Hum isse app better banayenge.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Type Selection */}
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Kya type ka feedback hai?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;
                        return (
                          <motion.button
                            key={type.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedType(type.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                              isSelected ? type.selectedColor : `${type.color} opacity-60`
                            }`}
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold">{type.label}</p>
                              <span className="text-sm">{type.emoji}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  {selectedType && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Apna feedback likho
                      </p>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          feedbackTypes.find((t) => t.id === selectedType)?.placeholder
                        }
                        rows={4}
                        className="w-full p-3.5 rounded-xl border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground/50"
                      />
                      <p className="text-[11px] text-muted-foreground/50 mt-1 text-right">
                        {message.length}/500
                      </p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedType || !message.trim() || sending}
                    className="w-full h-[52px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[16px] font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
