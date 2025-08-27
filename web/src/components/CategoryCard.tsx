"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventItem } from "@/lib/api";

interface CategoryCardProps {
  name: string;
  slug: string;
  events: EventItem[];
  eventCount?: number;
  isLoading?: boolean;
}

export default function CategoryCard({ name, slug, events, eventCount, isLoading }: CategoryCardProps) {
  const router = useRouter();
  
  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/all?category=${encodeURIComponent(slug)}`);
  };

  const handleCategoryClick = () => {
    router.push(`/all?category=${encodeURIComponent(slug)}`);
  };

  if (isLoading) {
    return (
      <Card className="min-w-[380px] max-w-[380px] cursor-pointer group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4 w-3/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="min-w-[380px] max-w-[380px] cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={handleCategoryClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {name}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {eventCount || events.length}
          </Badge>
        </div>
        
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <div 
                key={event.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/event/${event.slug}`);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm line-clamp-1">
                    {event.title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {new Date(event.startDate).toLocaleDateString()} 
                    {event.venue && ` • ${event.venue.name}`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.attendanceCounts?.going || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">🎭</div>
            <div className="text-sm">No events yet</div>
          </div>
        )}
        
        {events.length > 0 && (
          <button
            onClick={handleShowMore}
            className="w-full mt-4 text-sm text-primary hover:underline transition-colors"
          >
            Show more {name.toLowerCase()} events →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
