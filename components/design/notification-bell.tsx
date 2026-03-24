"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Layers, MessageSquare, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVoterId } from "@/lib/design-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: "session_created" | "vote_cast" | "comment_added";
  session_id: string;
  session_title: string;
  actor_name: string | null;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeIcon = {
  session_created: Layers,
  vote_cast: Vote,
  comment_added: MessageSquare,
} as const;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ labelClass }: { labelClass: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchNotifications = useCallback(async () => {
    try {
      const vid = getVoterId();
      const res = await fetch(`/api/design/notifications?limit=20&voterId=${encodeURIComponent(vid)}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const vid = getVoterId();
        const res = await fetch(`/api/design/notifications?limit=20&voterId=${encodeURIComponent(vid)}`);
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // silently fail
      }
    }

    void loadNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const vid = getVoterId();
      await fetch("/api/design/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: vid }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full overflow-hidden text-muted-foreground hover:text-foreground">
          <div className="relative shrink-0">
            <Bell className="size-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className={cn("text-sm", labelClass)}>
            Notifications
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-80 p-0 max-h-[400px] overflow-hidden flex flex-col"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <Link
                  key={n.id}
                  href={n.link || `/explorations/${n.session_id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                    !n.read && "bg-muted/30"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="shrink-0 mt-2">
                      <div className="size-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
