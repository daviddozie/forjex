import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200/40 dark:bg-neutral-800/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
