import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Building2, 
  ArrowRight, 
  Check, 
  X, 
  Film, 
  Camera, 
  MapPin, 
  Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToDispatch?: () => void;
  onNavigateToStudios?: () => void;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  accentColor: string;
  badge: string;
  actionText: string;
  perks: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Generate AI creatives',
    subtitle: 'Direct Commercial Concepts in Seconds',
    description: 'Transform your brand thesis into viral 9:16 scripts, storyboard frames, and director notes with multi-model intelligence.',
    icon: Sparkles,
    accentColor: 'from-sleek-violet to-purple-600',
    badge: 'Step 1 of 3 • Ideation Engine',
    actionText: 'Try AI Create',
    perks: ['Viral 9:16 hook formulas', 'Cinematic camera angles', 'One-click script export']
  },
  {
    title: 'Dispatch real creators in minutes',
    subtitle: 'Uber-Style Creator Fleet on Demand',
    description: 'Summon verified reel creators, cinema videographers, and DaVinci colorists right to your shoot location with live escrow.',
    icon: Zap,
    accentColor: 'from-emerald-500 to-teal-600',
    badge: 'Step 2 of 3 • Real-Time Dispatch',
    actionText: 'Open Dispatch Radar',
    perks: ['Verified 4K equipment rigs', 'Arrives under 45 minutes', 'Secure milestone escrow']
  },
  {
    title: 'Book studios & track projects',
    subtitle: 'Production Pipeline & Verified Spaces',
    description: 'Reserve aesthetic daylight lofts, cyclorama walls, and soundstages with instant booking, then track end-to-end production.',
    icon: Building2,
    accentColor: 'from-purple-600 to-pink-600',
    badge: 'Step 3 of 3 • Spaces & Tracking',
    actionText: 'Get Started Now',
    perks: ['14-day slot availability', 'Milestone pipeline tracking', 'High-res master distribution']
  }
];

export default function OnboardingModal({
  isOpen,
  onClose,
  onNavigateToCreate,
  onNavigateToDispatch,
  onNavigateToStudios
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onlycreation_onboarding_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('onlycreation_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-sleek-dark border border-white/15 rounded-[36px] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col gap-5 text-left"
      >
        {/* Glow backdrop */}
        <div 
          className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${step.accentColor} opacity-25 blur-[60px] rounded-full pointer-events-none transition-all duration-700`} 
        />

        {/* Top Progress & Skip */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-sleek-violet'
                    : i < currentStep
                    ? 'w-2 bg-white/60'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors px-2 py-1"
          >
            Skip Tour
          </button>
        </div>

        {/* Step Icon & Badge */}
        <div className="flex flex-col gap-3 relative z-10 pt-1">
          <div className="flex items-center justify-between">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accentColor} p-0.5 shadow-xl`}>
              <div className="w-full h-full bg-sleek-dark/80 rounded-[14px] flex items-center justify-center text-white backdrop-blur-sm">
                <StepIcon size={26} />
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {step.badge}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-white">{step.title}</h2>
            <p className="text-xs font-bold text-sleek-violet mt-0.5">{step.subtitle}</p>
          </div>

          <p className="text-xs text-white/70 leading-relaxed font-normal">
            {step.description}
          </p>

          {/* Perks list */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
            {step.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-white/80">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={10} />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2 relative z-10">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold uppercase transition-all"
            >
              Back
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all"
          >
            <span>{isLast ? 'Get Started' : 'Next Step'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
