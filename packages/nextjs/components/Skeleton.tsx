import React from "react";

type SkeletonProps = {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shimmer?: boolean;
};

const roundedMap: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", rounded = "md", shimmer = true }) => {
  return (
    <div
      className={["bg-base-300/70", roundedMap[rounded], shimmer ? "animate-pulse" : "", className].join(" ")}
      aria-hidden
      role="presentation"
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = "" }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <Skeleton className={index === lines - 1 ? "h-3 w-3/5" : "h-3 w-full"} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = "" }) => {
  return <Skeleton className={"h-10 w-10"} rounded="full" />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={["p-4 border border-base-200 rounded-xl", className].join(" ")}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/4 mt-2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full mt-4" rounded="lg" />
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export default Skeleton;
