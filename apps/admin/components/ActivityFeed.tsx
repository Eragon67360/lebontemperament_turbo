'use client'

import { Card } from '@/components/ui/card'
import { Bell, UserPlus, Music, Users2, Calendar, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from '@/types/activities'
import { Button } from './ui/button'

function getActivityIcon(type: string) {
    const iconClasses = "h-4 w-4 text-primary"
    switch (type) {
        case 'user_created':
            return <UserPlus className={iconClasses} />
        case 'concert_created':
        case 'concert_updated':
            return <Music className={iconClasses} />
        case 'group_updated':
            return <Users2 className={iconClasses} />
        default:
            return <Calendar className={iconClasses} />
    }
}

function ActivityRowSkeleton() {
    return (
        <div className="flex items-start space-x-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px] rounded-full" />
                <Skeleton className="h-3 w-[300px] rounded-full" />
                <Skeleton className="h-3 w-[100px] rounded-full" />
            </div>
        </div>
    )
}
export function ActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [visibleActivities, setVisibleActivities] = useState(5)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setIsLoading(true)
                const response = await fetch('/api/activities?limit=15')
                if (!response.ok) throw new Error('Failed to fetch activities')
                const data = await response.json()
                setActivities(data)
            } catch (error) {
                console.error('Error fetching activities:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchActivities()
    }, [])
    const handleShowMore = () => {
        setVisibleActivities(prev => Math.min(prev + 5, activities.length))
    }

    return (
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Bell className="size-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">
                            Activités récentes
                            {!isLoading && (
                                <span className="text-sm text-muted-foreground ml-2">
                                    ({activities.length})
                                </span>
                            )}
                        </h2>
                    </div>
                </div>

                <div className="space-y-2">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, index) => (
                                <ActivityRowSkeleton key={index} />
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-primary/5 rounded-full mb-4">
                                <Bell className="h-8 w-8 text-primary/30" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Aucune activité récente à afficher
                            </p>
                        </div>
                    ) : (
                        <>
                            {activities.slice(0, visibleActivities).map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start space-x-4 p-3 hover:bg-primary/5 rounded-xl transition-colors"
                                >
                                    <div className="p-2 bg-primary/10 rounded-full mt-1">
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    <div className="flex-1 space-y-1.5">
                                        <p className="text-sm font-medium leading-tight">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {formatDistanceToNow(new Date(activity.created_at), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>
                                            {activity.profiles && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                    <span>{activity.profiles.display_name || activity.profiles.email}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {visibleActivities < activities.length && (
                                <div className="flex justify-center pt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={handleShowMore}
                                        className="rounded-full hover:bg-primary/10 transition-colors"
                                    >
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Afficher plus
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    )
}
