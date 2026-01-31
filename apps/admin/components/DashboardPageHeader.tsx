// components/DashboardPageHeader.tsx
interface DashboardPageHeaderProps {
  title: string;
  description?: string;
}

export function DashboardPageHeader({
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
