export function TimelineSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
