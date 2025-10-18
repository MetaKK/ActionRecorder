export function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}
