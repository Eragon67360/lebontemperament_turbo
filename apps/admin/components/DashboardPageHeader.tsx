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
    <div className="mb-4 sm:mb-8">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground mt-0">
          {description}
        </p>
      )}
    </div>
  );
}
