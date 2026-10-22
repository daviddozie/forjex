import Image from "next/image";
import { cn } from "@/lib/utils";

export type Technology =
  | "nextjs"
  | "react-vite"
  | "python"
  | "go"
  | "rust"
  | "nodejs"
  | "vue-vite";

type Logo = "nextjs" | "react" | "vite" | "python" | "go" | "rust" | "nodejs" | "vue";

const logos: Record<Technology, readonly Logo[]> = {
  nextjs: ["nextjs"],
  "react-vite": ["react", "vite"],
  python: ["python"],
  go: ["go"],
  rust: ["rust"],
  nodejs: ["nodejs"],
  "vue-vite": ["vue", "vite"],
};

/** Decorative brand marks; the adjacent technology name supplies the accessible label. */
export function TechnologyIcon({
  technology,
  size = 28,
  className,
}: {
  technology: Technology;
  size?: number;
  className?: string;
}) {
  const marks = logos[technology];
  const markSize = marks.length > 1 ? Math.round(size * 0.8) : size;

  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center gap-1.5", className)}>
      {marks.map((logo) => {
        const width = logo === "go" ? Math.round(markSize * 1.4) : markSize;
        const height = logo === "go" ? Math.round(width * 48 / 128) : markSize;
        return <Image
          key={logo}
          src={`/icons/technologies/${logo}.svg`}
          alt=""
          width={width}
          height={height}
          style={{ height: "auto" }}
          className={cn("shrink-0 object-contain", (logo === "nextjs" || logo === "rust") && "dark:invert")}
          draggable={false}
        />;
      })}
    </span>
  );
}
