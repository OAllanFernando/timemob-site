import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PlaceholderCardProps {
    title: string;
    body: string;
    skeletons?: number;
}

export function PlaceholderCard({ title, body, skeletons = 0 }: PlaceholderCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading text-xl font-medium tracking-tight">
                    {title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{body}</p>
            </CardHeader>
            {skeletons > 0 && (
                <CardContent className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: skeletons }).map((_, i) => (
                        <div
                            key={i}
                            className="space-y-3 rounded-lg border border-border bg-background p-4"
                        >
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </CardContent>
            )}
        </Card>
    );
}
