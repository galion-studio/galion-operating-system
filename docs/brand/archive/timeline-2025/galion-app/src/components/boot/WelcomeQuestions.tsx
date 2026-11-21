'use client';

/**
 * WelcomeQuestions - Deep Personalization Flow
 * =============================================
 *
 * Inspired by "Her" (2013) - A warm, intimate onboarding experience
 * that establishes emotional connection with the AI from the first interaction.
 *
 * Features:
 * - Typewriter text animation for questions
 * - Voice reads questions aloud (optional)
 * - Smooth transitions between questions
 * - Skip option for each question
 * - Progress indicator
 * - Emotion detection on user responses
 * - Store answers in user profile
 * - Voice/text input toggle
 *
 * Based on BACKEND5.4.2FINAL.md Welcome Questions spec
 */

import React, { FC, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { COLORS, EASING, Z_INDEX } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type VoicePersona = 'samantha' | 'jarvis';

export interface WelcomeAnswer {
  questionId: string;
  question: string;
  answer: string;
  emotion?: string;
  emotionIntensity?: number;
  timestamp: number;
  skipped: boolean;
}

export interface WelcomeQuestionsResult {
  name: string;
  voicePersona: VoicePersona;
  answers: WelcomeAnswer[];
  completedAt: number;
  totalTimeMs: number;
}

export interface WelcomeQuestionsProps {
  /** Called when all questions are answered or skipped */
  onComplete: (result: WelcomeQuestionsResult) => void;
  /** Called when Samantha/JARVIS is selected */
  onVoiceSelected?: (persona: VoicePersona) => void;
  /** Called when user skips onboarding entirely */
  onSkip?: () => void;
  /** Enable voice reading of questions */
  enableVoiceReading?: boolean;
  /** Custom className */
  className?: string;
  /** Starting question index (for resuming) */
  startIndex?: number;
}

interface Question {
  id: string;
  text: string;
  purpose: string;
  emotion: string;
  type: 'name' | 'voice-select' | 'open-text' | 'deep-text';
  placeholder?: string;
  options?: { value: string; label: string; description?: string }[];
}

// ============================================================================
// QUESTIONS (From BACKEND5.4.2FINAL.md)
// ============================================================================

const WELCOME_QUESTIONS: Question[] = [
  {
    id: 'name',
    text: 'What shall I call you?',
    purpose: 'Name personalization',
    emotion: 'curious',
    type: 'name',
    placeholder: 'Your name...',
  },
  {
    id: 'voice',
    text: 'Would you prefer if I sound more like Samantha or JARVIS?',
    purpose: 'Voice selection',
    emotion: 'interested',
    type: 'voice-select',
    options: [
      { value: 'samantha', label: 'Samantha', description: 'Warm, intuitive, emotionally intelligent' },
      { value: 'jarvis', label: 'JARVIS', description: 'Professional, witty, helpful' },
    ],
  },
  {
    id: 'mind',
    text: "What's been on your mind lately?",
    purpose: 'Establish emotional baseline',
    emotion: 'empathetic',
    type: 'open-text',
    placeholder: 'Share what you have been thinking about...',
  },
  {
    id: 'help',
    text: 'How can I best help you today?',
    purpose: 'Understand immediate need',
    emotion: 'focused',
    type: 'open-text',
    placeholder: 'What brings you here...',
  },
  {
    id: 'curiosity',
    text: "Is there anything you've always wanted to ask an AI?",
    purpose: 'Deep conversation starter',
    emotion: 'curious',
    type: 'deep-text',
    placeholder: 'Ask anything...',
  },
];

// ============================================================================
// EMOTION COLORS
// ============================================================================

const EMOTION_COLORS: Record<string, { primary: string; glow: string }> = {
  curious: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
  interested: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  empathetic: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
  focused: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  happy: { primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
  neutral: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.4)' },
};

// ============================================================================
// TYPEWRITER ANIMATION COMPONENT
// ============================================================================

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  onComplete,
  className,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-1"
        >
          |
        </motion.span>
      )}
    </span>
  );
};

// ============================================================================
// ORB COMPONENT (Simplified for welcome flow)
// ============================================================================

interface WelcomeOrbProps {
  emotion: string;
  isAsking: boolean;
  audioLevel?: number;
}

const WelcomeOrb: FC<WelcomeOrbProps> = ({ emotion, isAsking, audioLevel = 0 }) => {
  const colors = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  return (
    <motion.div
      className="relative w-32 h-32 md:w-40 md:h-40"
      animate={{
        scale: isAsking ? [1, 1.02, 1] : [1, 1.01, 1],
      }}
      transition={{
        duration: isAsking ? 2 : 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ backgroundColor: colors.glow }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Middle glow */}
      <motion.div
        className="absolute inset-2 rounded-full blur-xl"
        style={{ backgroundColor: colors.primary }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.primary}80)`,
          boxShadow: `
            0 0 40px ${colors.glow},
            0 0 80px ${colors.glow},
            inset 0 0 40px ${colors.glow}
          `,
        }}
        animate={{
          scale: 1 + audioLevel * 0.1,
        }}
        transition={{ duration: 0.1 }}
      >
        {/* Inner highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3), transparent 60%)',
          }}
        />
      </motion.div>

      {/* Pulse ring when asking */}
      {isAsking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: colors.primary }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.6, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

const ProgressIndicator: FC<ProgressIndicatorProps> = ({ current, total }) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            index < current ? 'w-8 bg-cyan-400' : index === current ? 'w-8 bg-cyan-400/50' : 'w-2 bg-white/20'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// VOICE SELECT OPTION
// ============================================================================

interface VoiceOptionProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

const VoiceOption: FC<VoiceOptionProps> = ({
  value,
  label,
  description,
  selected,
  onClick,
}) => {
  const isSamantha = value === 'samantha';

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full p-6 rounded-2xl border-2 transition-all duration-300',
        'backdrop-blur-sm text-left group',
        selected
          ? 'border-cyan-400 bg-cyan-400/10'
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect when selected */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: isSamantha
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
            filter: 'blur(20px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {/* Voice icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isSamantha ? 'bg-pink-500/20' : 'bg-blue-500/20'
            )}
          >
            {isSamantha ? (
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-semibold text-white">{label}</h3>

          {/* Selected indicator */}
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>

        <p className="text-sm text-white/60">{description}</p>
      </div>
    </motion.button>
  );
};

// ============================================================================
// INPUT FIELD
// ============================================================================

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  emotion: string;
  isMultiline?: boolean;
}

const InputField: FC<InputFieldProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  emotion,
  isMultiline = false,
}) => {
  const colors = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  const baseClasses = cn(
    'w-full bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4',
    'text-white text-lg placeholder-white/30',
    'border-2 border-transparent focus:border-cyan-400/50',
    'outline-none transition-all duration-300',
    'focus:bg-white/10'
  );

  return (
    <div className="relative w-full max-w-md">
      {/* Input glow */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${colors.glow}, transparent)`,
          filter: 'blur(20px)',
        }}
      />

      {isMultiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(baseClasses, 'min-h-[120px] resize-none')}
          rows={4}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}

      {/* Submit button */}
      <motion.button
        onClick={onSubmit}
        disabled={!value.trim()}
        className={cn(
          'absolute right-3 bottom-3 w-10 h-10 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300',
          value.trim()
            ? 'bg-cyan-400 text-black hover:bg-cyan-300'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        )}
        whileHover={value.trim() ? { scale: 1.1 } : {}}
        whileTap={value.trim() ? { scale: 0.9 } : {}}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </motion.button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WelcomeQuestions: FC<WelcomeQuestionsProps> = ({
  onComplete,
  onVoiceSelected,
  onSkip,
  enableVoiceReading = false,
  className,
  startIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<WelcomeAnswer[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona | null>(null);
  const [userName, setUserName] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startTimeRef = useRef(Date.now());

  const currentQuestion = WELCOME_QUESTIONS[currentIndex];
  const isComplete = currentIndex >= WELCOME_QUESTIONS.length;

  // Handle question completion
  const handleNext = useCallback((answer: string, skipped: boolean = false) => {
    if (isTransitioning) return;

    const newAnswer: WelcomeAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      answer,
      timestamp: Date.now(),
      skipped,
      // TODO: Add emotion detection from answer text
    };

    setAnswers((prev) => [...prev, newAnswer]);

    // Store name if this is the name question
    if (currentQuestion.type === 'name' && answer) {
      setUserName(answer);
    }

    // Trigger voice selected callback
    if (currentQuestion.type === 'voice-select' && selectedVoice) {
      onVoiceSelected?.(selectedVoice);
    }

    // Transition to next question
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setInputValue('');
      setIsTyping(true);
      setIsTransitioning(false);
    }, 500);
  }, [currentQuestion, isTransitioning, selectedVoice, onVoiceSelected]);

  // Handle skip current question
  const handleSkip = useCallback(() => {
    handleNext('', true);
  }, [handleNext]);

  // Handle skip all
  const handleSkipAll = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  // Handle voice selection
  const handleVoiceSelect = useCallback((voice: VoicePersona) => {
    setSelectedVoice(voice);
  }, []);

  // Handle submit for voice selection
  const handleVoiceSubmit = useCallback(() => {
    if (selectedVoice) {
      handleNext(selectedVoice, false);
    }
  }, [selectedVoice, handleNext]);

  // Handle text input submit
  const handleTextSubmit = useCallback(() => {
    if (inputValue.trim()) {
      handleNext(inputValue.trim(), false);
    }
  }, [inputValue, handleNext]);

  // Complete the flow
  useEffect(() => {
    if (isComplete && answers.length === WELCOME_QUESTIONS.length) {
      const result: WelcomeQuestionsResult = {
        name: userName || 'Friend',
        voicePersona: selectedVoice || 'samantha',
        answers,
        completedAt: Date.now(),
        totalTimeMs: Date.now() - startTimeRef.current,
      };
      onComplete(result);
    }
  }, [isComplete, answers, userName, selectedVoice, onComplete]);

  if (isComplete) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-b from-slate-950 via-slate-900 to-black',
        className
      )}
    >
      {/* Aurora background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Aurora layers */}
        <motion.div
          className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, rgba(6, 182, 212, 0.15), transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent 50%),
              radial-gradient(ellipse 70% 50% at 50% 80%, rgba(59, 130, 246, 0.08), transparent 50%)
            `,
          }}
          animate={{
            rotate: [0, 10, 0, -10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Stars */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px bg-white rounded-full"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: (i % 10) * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Skip all button */}
      <motion.button
        onClick={handleSkipAll}
        className="absolute top-6 right-6 text-white/40 hover:text-white/70 text-sm transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Skip setup
      </motion.button>

      {/* Progress indicator */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ProgressIndicator current={currentIndex} total={WELCOME_QUESTIONS.length} />
      </motion.div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="flex flex-col items-center gap-8 px-6 max-w-2xl w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: EASING.SMOOTH }}
        >
          {/* Orb */}
          <WelcomeOrb
            emotion={currentQuestion.emotion}
            isAsking={isTyping}
          />

          {/* Personalized greeting for returning questions */}
          {currentIndex > 0 && userName && (
            <motion.p
              className="text-white/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {userName}
            </motion.p>
          )}

          {/* Question with typewriter effect */}
          <motion.h2
            className="text-2xl md:text-3xl font-light text-white text-center leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TypewriterText
              text={currentQuestion.text}
              speed={40}
              onComplete={() => setIsTyping(false)}
            />
          </motion.h2>

          {/* Input area - appears after typing */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div
                className="w-full flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {/* Voice selection */}
                {currentQuestion.type === 'voice-select' && currentQuestion.options && (
                  <div className="w-full max-w-md space-y-3">
                    {currentQuestion.options.map((option) => (
                      <VoiceOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        description={option.description}
                        selected={selectedVoice === option.value}
                        onClick={() => handleVoiceSelect(option.value as VoicePersona)}
                      />
                    ))}

                    {/* Continue button for voice selection */}
                    <motion.button
                      onClick={handleVoiceSubmit}
                      disabled={!selectedVoice}
                      className={cn(
                        'w-full mt-4 py-4 rounded-xl font-medium text-lg',
                        'transition-all duration-300',
                        selectedVoice
                          ? 'bg-cyan-400 text-black hover:bg-cyan-300'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      )}
                      whileHover={selectedVoice ? { scale: 1.02 } : {}}
                      whileTap={selectedVoice ? { scale: 0.98 } : {}}
                    >
                      Continue
                    </motion.button>
                  </div>
                )}

                {/* Text input for name */}
                {currentQuestion.type === 'name' && (
                  <InputField
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleTextSubmit}
                    placeholder={currentQuestion.placeholder}
                    emotion={currentQuestion.emotion}
                  />
                )}

                {/* Text input for open questions */}
                {(currentQuestion.type === 'open-text' || currentQuestion.type === 'deep-text') && (
                  <InputField
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleTextSubmit}
                    placeholder={currentQuestion.placeholder}
                    emotion={currentQuestion.emotion}
                    isMultiline={currentQuestion.type === 'deep-text'}
                  />
                )}

                {/* Skip button */}
                <motion.button
                  onClick={handleSkip}
                  className="text-white/30 hover:text-white/60 text-sm transition-colors mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Skip this question
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

export default WelcomeQuestions;
