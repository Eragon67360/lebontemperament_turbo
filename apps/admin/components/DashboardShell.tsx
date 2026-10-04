"use client";

import { BugReportDialog } from "@/components/BugReportDialog";
import { MessagesDialog } from "@/components/MessagesDialog";
import { PageTransition } from "@/components/PageTransition";
import { AppHeader } from "@/components/shell/AppHeader";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { ShellDialogsProvider } from "@/components/shell/ShellDialogs";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useMyBugReports } from "@/hooks/useMyBugReports";
import { useUnreadBugReports } from "@/hooks/useUnreadBugReports";
import { buildNavSections } from "@/lib/navigation";
import { useMemo, useState } from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Direction B's shell: a 280 px sidebar from `lg`, a drawer below it, a
 * sticky header with « Vous êtes ici » and the account menu, and the page in
 * a scrolling column capped at 1120 px. The badge queries live here, always
 * mounted, so the counts stay fresh whatever is open.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);

  const { data: profile } = useCurrentProfile();
  const { data: unreadBugReports = 0 } = useUnreadBugReports();
  const { data: myBugReports = [] } = useMyBugReports();

  const unreadMessages = myBugReports.reduce(
    (total, report) => total + (report.unread_count || 0),
    0,
  );

  const sections = buildNavSections({
    unreadBugReports,
    isSuperAdmin: profile?.role === "superadmin",
  });

  // Pages (the home's « Lire » task) open the dialogs through this context.
  const dialogs = useMemo(
    () => ({
      openMessages: () => setMessagesDialogOpen(true),
      openBugReport: () => setBugReportDialogOpen(true),
    }),
    [],
  );

  return (
    <>
      <a
        href="#main"
        className="bg-card border-border-strong text-foreground sr-only z-[100] rounded-sm border px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-4"
      >
        Aller au contenu
      </a>

      {/* h-dvh, not h-screen: 100vh ignores mobile browser chrome and cuts the
          bottom of the shell off behind Safari's address bar. */}
      <div className="bg-background flex h-dvh overflow-hidden">
        <aside className="border-border bg-sidebar hidden w-[280px] shrink-0 border-r lg:flex lg:flex-col">
          <AppSidebar sections={sections} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            sections={sections}
            unreadMessages={unreadMessages}
            onOpenMessages={() => setMessagesDialogOpen(true)}
            onOpenBugReport={() => setBugReportDialogOpen(true)}
          />
          <main
            id="main"
            tabIndex={-1}
            className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
          >
            <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col px-4 lg:px-8">
              <ShellDialogsProvider value={dialogs}>
                <PageTransition>{children}</PageTransition>
              </ShellDialogsProvider>
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs outside the header and the drawer so they don't unmount with them. */}
      <MessagesDialog
        open={messagesDialogOpen}
        onOpenChange={setMessagesDialogOpen}
      />
      <BugReportDialog
        open={bugReportDialogOpen}
        onOpenChange={setBugReportDialogOpen}
      />
    </>
  );
}
