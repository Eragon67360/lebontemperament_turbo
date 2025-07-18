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
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-0 text-sm sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
