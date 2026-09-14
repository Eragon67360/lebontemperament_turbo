"use client";

import { BugReportDialog } from "@/components/BugReportDialog";
import { DashboardMainContent } from "@/components/DashboardMainContent";
import { MessagesDialog } from "@/components/MessagesDialog";
import { MobileSidebar } from "@/components/MobileSidebar";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);

  return (
    <>
      <div className="from-primary/10 to-primary/50 flex h-screen flex-col gap-2 overflow-hidden bg-gradient-to-br p-2 md:flex-row md:gap-4 md:p-4">
        {/* Mobile top bar (owns the nav sheet trigger) */}
        <MobileSidebar
          setMessagesDialogOpen={setMessagesDialogOpen}
          setBugReportDialogOpen={setBugReportDialogOpen}
        />

        {/* Sidebar for desktop */}
        <div className="hidden md:block md:w-64 md:shrink-0">
          <Sidebar
            setMessagesDialogOpen={setMessagesDialogOpen}
            setBugReportDialogOpen={setBugReportDialogOpen}
          />
        </div>

        {/* Main Content */}
        <DashboardMainContent>{children}</DashboardMainContent>
      </div>

      {/* Dialogs - Outside sidebar so they don't unmount */}
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
