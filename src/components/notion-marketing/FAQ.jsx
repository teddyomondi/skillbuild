import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Why practice instead of watching video tutorials?",
    answer:
      "Watching videos creates the illusion of understanding. By coding in a live IDE and solving problems on a digital board yourself, you uncover misconceptions instantly and build lasting competence.",
  },
  {
    question: "How does the AI tutor help without spoiling answers?",
    answer:
      "The tutor uses Socratic questioning. It reviews your code or whiteboard steps in real time, spots where your logic broke down, and asks targeted questions that guide you to solve it yourself.",
  },
  {
    question: "What subjects and workspaces are available?",
    answer:
      "Upskill provides an in-browser IDE with live preview and terminal for Software Engineering, and an interactive digital whiteboard for visual and algebraic Mathematics.",
  },
  {
    question: "How is the curriculum aligned with market needs?",
    answer:
      "Our learning paths combine Kenya-aligned educational requirements with the exact technologies, problem-solving skills, and competencies modern employers demand.",
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
            How active practice, market alignment, and our Socratic AI tutor turn study into real-world mastery.
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
