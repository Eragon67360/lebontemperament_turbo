// components/BugReportStatus.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/client"
import { Bug } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import RouteNames from "@/utils/routes"

export function BugReportStatus() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Check if user is superadmin
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                setIsSuperAdmin(profile?.role === 'superadmin')
            }
        }

        // Get unread reports count
        const fetchUnreadCount = async () => {
            const { count } = await supabase
                .from('bug_reports')
                .select('*', { count: 'exact' })
                .eq('is_read', false)

            setUnreadCount(count || 0)
        }

        checkRole()
        fetchUnreadCount()

        // Real-time subscription for new reports
        const subscription = supabase
            .channel('bug_reports_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bug_reports' },
                fetchUnreadCount
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    if (!isSuperAdmin) return null

    return (
        <Link href={RouteNames.DASHBOARD.ADMIN.BUG_REPORTS} className="hidden xl:block">
            <Button variant="ghost" className="inset-0 w-full justify-start">
                <Bug className="h-4 w-4 mr-2" />
                <span>Bug Reports</span>
                {unreadCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                        {unreadCount}
                    </Badge>
                )}
            </Button>

        </Link>
    )
}
