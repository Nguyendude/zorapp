import { Skeleton, SkeletonText } from "~~/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <SkeletonText lines={10} />
    </div>
  );
}


