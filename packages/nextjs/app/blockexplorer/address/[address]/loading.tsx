import { Skeleton, SkeletonText } from "~~/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-8 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={6} />
        </div>
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}


