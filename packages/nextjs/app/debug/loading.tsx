import { Skeleton, SkeletonText } from "~~/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={6} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={6} />
        </div>
      </div>
    </div>
  );
}
