import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignUpButton, useAuth } from "@clerk/clerk-react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileCheck2,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stepsData = [
  {
    step: "01",
    badge: "Guided Course Paths",
    title: "Follow the lessons in order",
    description:
      "Choose a course and follow its visual lesson path. Each lesson builds on the one before it, so you can see where you are and what comes next.",
    points: [
      "See completed, current, and locked lessons at a glance",
      "Unlock the next lesson as you make progress",
      "Open a lesson in the interactive coding workspace",
    ],
    icon: Layers,
    preview: {
      header: "Frontend & Backend Curriculum Tree",
      subHeader: "Roadmap.sh Verified Learning Paths",
      items: [
        "1. Semantic HTML & Page Structure (Interactive Lab)",
        "2. HTML Lists & Hyperlinks (<ul>, <li>, <a>)",
        "3. Lexical Scope & Closures (State Encapsulation)",
      ],
      tag: "Live Workspace",
      tagVariant: "emerald",
    },
  },
  {
    step: "02",
    badge: "Live AI Walkthrough",
    title: "Scrimba-Style Live Typing & Voice Narration",
    description:
      "Instead of passive videos, watch the AI Instructor type code directly inside your Monaco editor with a multiplayer screen cursor and synchronized 40px subtitles.",
    points: [
      "Hardware-accelerated multiplayer AI cursor glides to exact lines",
      "Ask a question and continue from the point you paused",
      "Try the code yourself in the interactive workspace",
    ],
    icon: Brain,
    preview: {
      header: "Live Pair-Programming Session",
      subHeader: "Mode: AI_STREAMING → STUDENT_CHALLENGE",
      items: [
        "AI Cursor pointing at Line 17: withdraw(amount) handoff",
        "Synchronized neural voiceover + single-line subtitles",
        "Instant in-browser Node.js & HTML preview execution",
      ],
      tag: "Real-Time Telemetry",
      tagVariant: "blue",
    },
  },
  {
    step: "03",
    badge: "Socratic AI Evaluation",
    title: "A tutor that explains and listens",
    description:
      "The tutor explains what the code does and why it works. During the lesson, it pauses once to ask what you think, then responds to your answer in the conversation.",
    points: [
      "Uses Acorn JS AST & HTML DOM parsing alongside live LLM reasoning",
      "Asks one open-ended question in the middle of the lesson",
      "Voice microphone input lets you talk naturally to your AI mentor",
    ],
    icon: FileCheck2,
    preview: {
      header: "Your AI Tutor",
      subHeader: "Clear explanations and conversation",
      items: [
        "AST Analysis: Checked function parameters & return statement",
        "Paused mid-lesson for a learner reflection",
        "Pointed AI cursor directly to the line needing attention",
      ],
      tag: "Adaptive AI",
      tagVariant: "amber",
    },
  },
  {
    step: "04",
    badge: "Adaptive Detour Engine",
    title: "Personalized Next Modules Built on the Fly",
    description:
      "Whenever you struggle with a concept like closures, return values, or semantic tags, Upskill injects a tailored practice module as your very next step.",
    points: [
      "Dynamically injects custom modules into your learning path",
      "Adds practice lessons to your learning path when extra practice helps",
      "Tracks completion progress across all tracks and custom detours",
    ],
    icon: TrendingUp,
    preview: {
      header: "Adaptive Learning Path Engine",
      subHeader: "Custom Detour Injected Automatically",
      items: [
        "Completed: Semantic HTML & Page Structure",
        "Tailored Next Module: JavaScript Functions Step-by-Step",
        "Unlocked: Async JS, Promises & Microtask Queue",
      ],
      tag: "100% Personalized",
      tagVariant: "purple",
    },
  },
];

export const HowItWorks = ({ scrollContainerRef, onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.85);
  const [borderRadius, setBorderRadius] = useState(28);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || window;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const expandStart = windowHeight;
      const expandEnd = 0;
      const expandProgress = Math.min(
        Math.max((expandStart - rect.top) / (expandStart - expandEnd), 0),
        1
      );

      const targetScale = 0.85 + expandProgress * 0.15;
      setScale(targetScale);
      setBorderRadius(Math.round(28 * (1 - expandProgress)));

      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable > 0 && rect.top <= 0) {
        const scrolled = -rect.top;
        const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
        const stepIdx = Math.min(Math.floor(progress * 4), 3);
        setActiveStep(stepIdx);
      } else if (rect.top > 0) {
        setActiveStep(0);
      } else {
        setActiveStep(3);
      }
    };

    scrollTarget.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    handleScroll();

    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  const scrollToStep = (index) => {
    if (!containerRef.current) return;
    const scrollEl = scrollContainerRef?.current;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollableDistance = rect.height - window.innerHeight;
    const currentScrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;
    const targetScroll =
      currentScrollTop + rect.top + (index / 3.2) * totalScrollableDistance + 10;

    if (scrollEl) {
      scrollEl.scrollTo({ top: targetScroll, behavior: "smooth" });
    } else {
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  const currentStep = stepsData[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="w-full relative bg-transparent overflow-visible flex justify-center"
      style={{ height: "320vh" }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          borderRadius: `${borderRadius}px`,
          willChange: "transform, border-radius",
          transition:
            "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.15s ease-out",
        }}
        className={cn(
          "sticky top-0 w-full h-screen min-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden z-20 px-6 sm:px-10 md:px-16 py-8 md:py-12 border border-neutral-800 shadow-2xl",
          scale >= 0.99 && "rounded-none border-x-0 border-y-0"
        )}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-12 sm:pt-14 pb-4 border-b border-neutral-800/80">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-700 text-neutral-300">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>How Upskill Works</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-white font-serif">
              From concept to mastery in 4 interactive steps
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {stepsData.map((item, idx) => (
              <button
                key={item.step}
                type="button"
                onClick={() => scrollToStep(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5",
                  activeStep === idx
                    ? "bg-white text-black font-semibold shadow-md"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                )}
              >
                <span>{item.step}</span>
                <span className="hidden md:inline">
                  {item.badge.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-600">
                {currentStep.step}
              </span>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
                <StepIcon className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
                {currentStep.badge}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-white leading-tight font-serif">
              {currentStep.title}
            </h3>

            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              {currentStep.description}
            </p>

            <ul className="space-y-3 pt-2">
              {currentStep.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-6 sm:p-8 shadow-2xl overflow-hidden transition-all duration-300">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-neutral-200">
                    {currentStep.preview.header}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md border",
                    currentStep.preview.tagVariant === "emerald" &&
                      "bg-emerald-950/60 border-emerald-800/80 text-emerald-400",
                    currentStep.preview.tagVariant === "blue" &&
                      "bg-blue-950/60 border-blue-800/80 text-blue-400",
                    currentStep.preview.tagVariant === "amber" &&
                      "bg-amber-950/60 border-amber-800/80 text-amber-400",
                    currentStep.preview.tagVariant === "purple" &&
                      "bg-purple-950/60 border-purple-800/80 text-purple-400"
                  )}
                >
                  {currentStep.preview.tag}
                </span>
              </div>

              <p className="text-xs font-medium text-neutral-400 mb-4 uppercase tracking-wider">
                {currentStep.preview.subHeader}
              </p>

              <div className="space-y-2.5 mb-6">
                {currentStep.preview.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800/80 text-xs text-neutral-300 flex items-center justify-between"
                  >
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>AST &amp; WebContainer verified execution</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-300 font-medium">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span>100% Interactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="font-semibold text-white">
              Step 0{activeStep + 1} of 04
            </span>
            <div className="w-32 sm:w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
              />
            </div>
            <div className="hidden sm:flex items-center gap-1 text-neutral-500">
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
              <span>Scroll to navigate</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoaded && !isSignedIn && (
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl="/subjects"
                forceRedirectUrl="/subjects"
              >
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-neutral-200 transition-colors font-medium px-4 py-2 rounded-lg text-xs"
                >
                  Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </SignUpButton>
            )}
            {isLoaded && isSignedIn && (
              <Button
                size="sm"
                onClick={onEnterWorkspace}
                className="bg-white text-black hover:bg-neutral-200 transition-colors font-medium px-4 py-2 rounded-lg text-xs"
              >
                Open Courses <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
