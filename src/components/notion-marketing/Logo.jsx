import { cn } from "@/lib/utils";

const Logo = ({ forceDarkText, onClick } = {}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-x-3",
        onClick && "cursor-pointer"
      )}
    >
      <img
        src="/notion-icon.svg"
        alt="notion-icon"
        height="35"
        width="35"
        className={forceDarkText ? "block" : "dark:hidden"}
      />
      {!forceDarkText && (
        <img
          src="/notion-icon-dark.svg"
          alt="notion-icon"
          height="35"
          width="35"
          className="hidden dark:block"
        />
      )}
      <p
        className={cn(
          "font-semibold text-lg tracking-tight font-poppins",
          forceDarkText ? "text-neutral-900" : "text-foreground"
        )}
      >
        Upskill
      </p>
    </div>
  );
};

export default Logo;
