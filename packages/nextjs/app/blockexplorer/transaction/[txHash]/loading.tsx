import { Skeleton, SkeletonText } from "~~/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-8 w-[28rem]" />
      </div>
      <div className="space-y-4">
        <SkeletonText lines={8} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}


