import { Skeleton, SkeletonCard } from "~~/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}


