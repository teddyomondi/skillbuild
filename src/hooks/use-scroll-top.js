import { useEffect, useState } from "react";

export const useScrollTop = (threshold = 10, scrollContainerRef = null) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const target = scrollContainerRef?.current || window;
    const handleScroll = () => {
      const scrollTop =
        scrollContainerRef?.current
          ? scrollContainerRef.current.scrollTop
          : window.scrollY;
      if (scrollTop > threshold) setIsScrolled(true);
      else setIsScrolled(false);
    };
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [threshold, scrollContainerRef]);

  return isScrolled;
};
