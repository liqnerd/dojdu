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
      className="min-w-[380px] max-w-[380px] cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 hover:scale-105"
      onClick={handleCategoryClick}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="absolute inset-[1px] rounded-lg bg-background" />
      
      <CardContent className="relative p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-all duration-300 group-hover:scale-110 origin-left">
            {name}
          </h3>
          <Badge 
            variant="secondary" 
            className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 group-hover:scale-110"
          >
            {eventCount || events.length}
          </Badge>
        </div>
        
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <div 
                key={event.id} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-primary/20 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/event/${event.slug}`);
                }}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors duration-300">
                    {event.title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 text-primary/60">📅</span>
                    {new Date(event.startDate).toLocaleDateString()} 
                    {event.venue && (
                      <>
                        <span className="inline-block w-3 h-3 text-secondary/60">📍</span>
                        {event.venue.name}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gradient-to-r from-primary/10 to-secondary/10 px-2 py-1 rounded-full">
                  <span className="inline-block w-3 h-3">👥</span>
                  {event.attendanceCounts?.going || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground relative">
            <div className="text-4xl mb-2 animate-pulse">🎭</div>
            <div className="text-sm">No events yet</div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg opacity-50" />
          </div>
        )}
        
        {events.length > 0 && (
          <button
            onClick={handleShowMore}
            className="w-full mt-4 text-sm bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 text-primary hover:text-primary border border-primary/20 hover:border-primary/40 rounded-full px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 font-medium"
          >
            Show more {name.toLowerCase()} events →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
