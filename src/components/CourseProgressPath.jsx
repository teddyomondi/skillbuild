import {
  BookOpen,
  Braces,
  Check,
  Circle,
  Code2,
  Compass,
  Database,
  FunctionSquare,
  Grid,
  LockKeyhole,
  Rocket,
  Triangle,
} from "lucide-react";

const topicIcons = [BookOpen, Code2, Braces, Database, Rocket];
const mathsIcons = [Compass, FunctionSquare, Triangle, Circle, Grid];

function connectionPath(from, to) {
  const middleY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

export default function CourseProgressPath({ nodes, onSelectModule }) {
  if (!nodes?.length) return null;

  const spacing = 190;
  const points = nodes.map((_, index) => ({
    x: index % 2 === 0 ? 22 : 78,
    y: 64 + index * spacing,
  }));
  const height = points[points.length - 1].y + 70;

  return (
    <div className="relative mx-auto w-full max-w-3xl" style={{ height }}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {points.slice(0, -1).map((point, index) => {
          const d = connectionPath(point, points[index + 1]);
          const isComplete = nodes[index].status === "completed";
          return (
            <g key={nodes[index].id}>
              <path
                d={d}
                fill="none"
                stroke={isComplete ? "#9bbdb5" : "#cfe2f7"}
                strokeWidth="5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {nodes.map((node, index) => {
        const point = points[index];
        const isPrevCompleted = index === 0 || nodes[index - 1].status === "completed";
        const locked = node.status === "locked" ? !isPrevCompleted : (!isPrevCompleted && node.status !== "in-progress" && node.status !== "completed");
        const completed = node.status === "completed";
        const current = !locked && !completed;
        const TopicIcon = node.isMathBoard
          ? mathsIcons[index % mathsIcons.length]
          : topicIcons[index % topicIcons.length];

        return (
          <div key={node.id} className="absolute inset-x-0" style={{ top: point.y - 40 }}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onSelectModule(node)}
              aria-label={`${node.title.replace(/^\d+\.\s*/, "")}${locked ? ", locked" : ", open lesson"}`}
              className={`absolute z-10 flex h-20 w-20 items-center justify-center rounded-full border-[9px] bg-background transition-colors ${
                completed
                  ? "border-emerald-200 text-emerald-600 hover:border-emerald-300"
                  : current
                  ? "border-emerald-200 text-emerald-600 hover:border-emerald-300"
                  : "border-sky-100 text-slate-400"
              } ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{ left: `calc(${point.x}% - 40px)` }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card">
                {completed ? <Check className="h-8 w-8" /> : locked ? <LockKeyhole className="h-6 w-6" /> : <TopicIcon className="h-8 w-8" />}
              </span>
              {current && (
                <span className="absolute -bottom-3 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-amber-300 text-2xl leading-none text-amber-950 shadow-sm">
                  ☺
                </span>
              )}
            </button>

            <div
              className={`absolute top-2 min-w-0 ${
                point.x < 50
                  ? "left-[calc(22%+54px)] right-1 text-left"
                  : "left-1 right-[calc(22%+54px)] text-right"
              }`}
            >
              <div className={`text-2xl font-semibold ${locked ? "text-muted-foreground/60" : completed ? "text-emerald-600" : "text-emerald-600"}`}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                className={`mt-0.5 text-base leading-snug underline decoration-1 underline-offset-4 sm:text-lg ${
                  locked ? "text-muted-foreground/60" : "text-foreground"
                }`}
              >
                {node.title.replace(/^\d+\.\s*/, "")}
              </div>
              {current && <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Your next lesson</div>}
              {locked && <div className="mt-1 text-xs text-muted-foreground">Complete the lesson above to unlock</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
