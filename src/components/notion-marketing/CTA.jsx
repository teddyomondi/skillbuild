import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";

export const CTA = ({ scrollContainerRef, onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const cardRef = useRef(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || window;

    const handleScroll = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight;
      const end = windowHeight * 0.25;
      const progress = Math.min(
        Math.max((start - rect.top) / (start - end), 0),
        1
      );

      const targetScale = 0.85 + progress * 0.15;
      setScale(targetScale);
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  return (
    <section className="w-full py-20 px-4 md:px-8 flex justify-center items-center overflow-hidden">
      <div
        ref={cardRef}
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
        className="w-full max-w-5xl bg-black text-white rounded-3xl p-8 sm:p-14 md:p-20 text-center shadow-2xl border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white font-serif">
            Ready to master coding interactively?
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg md:text-xl font-normal max-w-lg mx-auto leading-relaxed">
            Follow your course path, learn one step at a time, and practice in the interactive coding workspace.
          </p>
          <div className="pt-2">
            {isLoaded && !isSignedIn && (
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl="/subjects"
                forceRedirectUrl="/subjects"
              >
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-neutral-200 transition-colors font-medium px-8 py-6 text-base rounded-md"
                >
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </SignUpButton>
            )}
            {isLoaded && isSignedIn && (
              <Button
                size="lg"
                onClick={onEnterWorkspace}
                className="bg-white text-black hover:bg-neutral-200 transition-colors font-medium px-8 py-6 text-base rounded-md"
              >
                Open Courses <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
