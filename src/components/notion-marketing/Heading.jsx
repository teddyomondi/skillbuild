import { Button } from "@/components/ui/button";
import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/spinner";

const Heading = ({ onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className={cn("max-w-xl h-full space-y-4 font-sans px-4")}>
      <h1
        className={cn(
          "text-4xl sm:text-6xl md:text-6xl font-normal tracking-tight font-serif"
        )}
      >
        Your Coding Mastery, Interactive
      </h1>
      <p className="text-base sm:text-xl md:text-2xl font-normal text-muted-foreground leading-relaxed">
        Choose a learning track, explore interactive modules, and practice live with an AI Voice Tutor.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {!isLoaded && (
          <div className="w-full flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}
        {isLoaded && !isSignedIn && (
          <SignUpButton
            mode="modal"
            fallbackRedirectUrl="/subjects"
            forceRedirectUrl="/subjects"
          >
            <Button size="lg" className="rounded-md">
              Start Learning Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </SignUpButton>
        )}
        {isLoaded && isSignedIn && (
          <Button size="lg" className="rounded-md" onClick={onEnterWorkspace}>
            Browse Courses &amp; Modules <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Heading;
