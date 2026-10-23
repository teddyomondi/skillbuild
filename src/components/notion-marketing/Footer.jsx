import { Button } from "@/components/ui/button";
import { SignUpButton, useAuth } from "@clerk/clerk-react";
import Logo from "./Logo";
import { GitBranchIcon } from "lucide-react";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#overview" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Curriculum", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Learning Tracks",
    links: [
      { label: "Frontend Developer", href: "#pricing" },
      { label: "Backend & Node.js", href: "#pricing" },
      { label: "AI Engineer", href: "#pricing" },
      { label: "Adaptive Detours", href: "#how-it-works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Courses", href: "#how-it-works" },
      { label: "Socratic AI Mentor", href: "#how-it-works" },
      { label: "Concept Visualizer", href: "#how-it-works" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "X", href: "https://x.com", external: true },
      {
        label: "GitHub",
        href: "https://github.com/zJUNAIDz/frontend",
        external: true,
      },
      { label: "LinkedIn", href: "https://linkedin.com", external: true },
    ],
  },
];

const Footer = ({ onEnterWorkspace }) => {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <footer className="w-full min-h-[70vh] flex flex-col justify-between bg-background dark:bg-[#1F1F1F] border-t border-border px-6 sm:px-12 md:px-20 lg:px-28 py-16 md:py-24 z-10">
      <div className="flex-1 flex flex-col lg:flex-row justify-between items-start gap-16 my-auto">
        <div className="flex flex-col items-start gap-y-6 max-w-sm">
          <Logo onClick={onEnterWorkspace} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            CodePulse guides learners through structured lessons with an interactive AI tutor.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {isLoaded && !isSignedIn ? (
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl="/subjects"
                forceRedirectUrl="/subjects"
              >
                <Button size="sm">Get Started Free</Button>
              </SignUpButton>
            ) : (
              <Button size="sm" onClick={onEnterWorkspace}>
                Browse Courses &amp; Modules
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 md:gap-14 lg:gap-16 w-full lg:w-auto">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-8 mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>
          &copy; {new Date().getFullYear()} CodePulse Learning. All rights reserved.
        </span>
        <Button variant="ghost" size="sm" asChild>
          <a
            className="flex items-center gap-x-2 text-muted-foreground hover:text-foreground"
            href="https://github.com/zJUNAIDz/frontend"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitBranchIcon className="h-4 w-4" /> Source code
          </a>
        </Button>
      </div>
    </footer>
  );
};

export default Footer;
