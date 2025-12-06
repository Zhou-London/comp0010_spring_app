const Skeleton = () => (
  <div className="surface-card group flex h-full flex-col gap-3 p-5 text-left">
    <div className="flex items-center justify-between gap-2">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-700" />
    </div>
    <div className="space-y-2">
      <div className="h-6 w-48 animate-pulse rounded bg-gray-700" />
      <div className="h-4 w-64 animate-pulse rounded bg-gray-700" />
      <div className="h-4 w-56 animate-pulse rounded bg-gray-700" />
    </div>
  </div>
);

export default Skeleton;
