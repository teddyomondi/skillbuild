import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How do I move through a course?",
    answer:
      "Choose a course to see its lessons in order. Complete each lesson to unlock the next one, and open an available lesson to learn and practice in the coding workspace.",
  },
  {
    question: "How does the Scrimba-style AI walkthrough work?",
    answer:
      "The instructor explains the code as it is added to the workspace. You can follow the example, ask the tutor about anything that is unclear, and then try the task yourself.",
  },
  {
    question: "What happens when I get stuck on a coding concept?",
    answer:
      "The tutor explains what the code does and why it is written that way. It points to the relevant line, gives you a useful next step, and asks one open question in the middle of the lesson. You can reply in the tutor chat and keep talking through the idea.",
  },
  {
    question: "Do I need an API key to use the AI Tutor?",
    answer:
      "The tutor uses a provider key configured by the platform. Learners do not need to enter API keys in the course workspace.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="w-full max-w-6xl mx-auto px-6 sm:px-10 md:px-12 py-20 md:py-28"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground font-serif">
            Questions people ask
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md">
            Learn how course progress, guided lessons, and the AI tutor work together.
          </p>
        </div>

        <div className="lg:col-span-7 divide-y divide-border border-y border-border">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between text-left gap-4 group focus-visible:outline-none"
                >
                  <span className="text-base sm:text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-foreground"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out overflow-hidden text-sm sm:text-base text-muted-foreground leading-relaxed",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 pt-3"
                      : "grid-rows-[0fr] opacity-0 pt-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
