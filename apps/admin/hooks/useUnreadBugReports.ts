import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useUnreadBugReports() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("id", { count: "exact" })
        .eq("is_read", false);

      if (error) {
        console.error("Error fetching unread bug reports:", error);
      } else {
        setUnreadCount(data.length);
      }
    };

    fetchUnreadCount();
  }, [supabase]);

  return unreadCount;
}
