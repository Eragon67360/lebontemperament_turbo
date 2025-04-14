import RouteNames from '@/utils/routes'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

interface ProtectedLayoutProps {
    children: ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect(RouteNames.AUTH.LOGIN)
    }
    return <>{children}</>
}
