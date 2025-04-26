// app/dashboard/bug-reports/page.tsx
"use client";

import { BugReportDetailsDialog } from "@/components/BugReportDetailsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";

type BugReport = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  reported_by: string;
  created_at: string;
  is_read: boolean;
  profiles: {
    email: string;
  };
};

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("bug_reports")
      .select(
        `
                *,
                profiles:reported_by(email)
            `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return;
    }

    if (data) {
      setReports(data as BugReport[]);
      // Mark all as read
      await supabase
        .from("bug_reports")
        .update({ is_read: true })
        .eq("is_read", false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReports();

    const subscription = supabase
      .channel("bug_reports_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bug_reports" },
        fetchReports,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchReports, supabase]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("bug_reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    fetchReports();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bug Reports</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.title}</TableCell>
              <TableCell>{report.profiles?.email}</TableCell>
              <TableCell>
                {new Date(report.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Select
                  value={report.status}
                  onValueChange={(value) => updateStatus(report.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <BugReportDetailsDialog report={report} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
