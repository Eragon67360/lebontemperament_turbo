
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function UserLoadingState() {
    return (
        <div className="w-full space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="mb-4">
                    <CardContent className="flex items-center justify-between p-6  flex-wrap md:flex-nowrap">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 w-full md:w-fit mt-4 md:mt-0">
                            <Skeleton className="h-6 w-[100px]" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
