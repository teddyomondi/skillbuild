import { useScrollTop } from "@/hooks/use-scroll-top";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import Spinner from "@/components/ui/spinner";

const Navbar = ({ scrollContainerRef, onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const isScrolled = useScrollTop(10, scrollContainerRef);

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto relative flex items-center justify-between w-full max-w-5xl rounded-md border border-border bg-white dark:bg-white text-neutral-900 px-6 py-3 shadow-sm transition-all duration-300",
          isScrolled && "shadow-md"
        )}
      >
        <Logo forceDarkText onClick={onEnterWorkspace} />

        <nav className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 gap-x-6 text-sm font-semibold text-neutral-900">
          <a href="#how-it-works" className="hover:text-black transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-black transition-colors">
            Curriculum
          </a>
          <a href="#faq" className="hover:text-black transition-colors">
            FAQ
          </a>
        </nav>

        <div className="md:ml-auto md:justify-end justify-between items-center flex gap-x-2">
          {!isLoaded && <Spinner />}
          {isLoaded && !isSignedIn && (
            <>
              <SignInButton
                mode="modal"
                fallbackRedirectUrl="/subjects"
                forceRedirectUrl="/subjects"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-900 hover:bg-neutral-100 hover:text-black"
                >
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl="/subjects"
                forceRedirectUrl="/subjects"
              >
                <Button
                  size="sm"
                  className="rounded-md bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  Get Started Free
                </Button>
              </SignUpButton>
            </>
          )}
          {isLoaded && isSignedIn && (
            <>
              <Button
                size="sm"
                onClick={onEnterWorkspace}
                className="rounded-md bg-neutral-900 text-white hover:bg-neutral-800"
              >
                Explore Courses <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <UserButton afterSignOutUrl="/welcome" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
