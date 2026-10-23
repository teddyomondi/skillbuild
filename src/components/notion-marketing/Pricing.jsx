import { Button } from "@/components/ui/button";
import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { ArrowRight, Check, Coins } from "lucide-react";

const features = [
  "Personalized course paths with clear lesson progress",
  "Live Scrimba-style AI Voice & Cursor IDE walkthroughs",
  "Adaptive detour modules generated automatically",
  "Works out of the box or with your own OpenAI / Gemini / Claude key",
];

export const Pricing = ({ onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <section
      id="pricing"
      className="w-full max-w-xl mx-auto px-6 py-16 md:py-24"
    >
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/10">
          <Coins className="h-3.5 w-3.5 text-primary" />
          <span>Open Learning Platform</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
          3 Adaptive Tracks Included
        </h2>

        <p className="text-muted-foreground text-sm sm:text-base">
          Frontend, Backend &amp; AI Engineering tracks with unlimited adaptive detours.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background dark:bg-[#141414] p-8 sm:p-10 shadow-lg space-y-6">
        <div className="text-center space-y-1 pb-6 border-b border-border">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
              Free
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              / unlimited labs
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Includes guided courses and the interactive learning workspace
          </p>
        </div>

        <ul className="space-y-3 py-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          {isLoaded && !isSignedIn && (
            <SignUpButton
              mode="modal"
              fallbackRedirectUrl="/subjects"
              forceRedirectUrl="/subjects"
            >
              <Button
                size="lg"
                className="w-full py-5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
              >
                Get Started Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </SignUpButton>
          )}
          {isLoaded && isSignedIn && (
            <Button
              size="lg"
              onClick={onEnterWorkspace}
              className="w-full py-5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
            >
              Open Courses <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground mt-3">
            Zero setup required • Instant in-browser execution
          </p>
        </div>
      </div>
    </section>
  );
};
