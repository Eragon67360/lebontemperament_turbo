// components/NotificationsPopover.tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Notification } from "@/types/notifications";

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        fetchNotifications,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);

    fetchNotifications();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative w-full justify-start">
          <Bell className="mr-2 size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
          Notifications
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h3 className="mb-2 font-semibold">Notifications</h3>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Aucune notification
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg p-3 ${
                    notification.read ? "bg-gray-50" : "bg-blue-50"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <h4 className="text-sm font-medium">{notification.title}</h4>
                  <p className="text-sm text-gray-500">
                    {notification.message}
                  </p>
                  {notification.reference_id && (
                    <Link
                      href={`/dashboard/bug-reports/${notification.reference_id}`}
                      className="mt-1 block text-sm text-blue-500 hover:underline"
                    >
                      Voir les détails
                    </Link>
                  )}
                  <span className="mt-1 block text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
