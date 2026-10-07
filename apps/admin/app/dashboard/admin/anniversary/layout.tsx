import { CampaignPagesNav } from "@/components/anniversary/CampaignPagesNav";

/** Every campaign page opens under the campaign's own menu. */
export default function AnniversaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CampaignPagesNav className="pt-4 sm:pt-6" />
      {children}
    </div>
  );
}
