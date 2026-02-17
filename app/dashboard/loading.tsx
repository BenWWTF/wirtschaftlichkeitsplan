export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-4 w-72 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-3"
          >
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
