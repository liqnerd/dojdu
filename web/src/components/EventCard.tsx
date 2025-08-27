"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RSVPStatus, EventItem, getStrapiImageUrl, rsvp } from "@/lib/api";
import LikeButton from "./LikeButton";

type Props = {
  event: EventItem;
  showActions?: boolean;
};

export default function EventCard({ event, showActions }: Props) {
  const router = useRouter();
  
  const onRSVP = async (e: React.MouseEvent, status: RSVPStatus) => {
    e.stopPropagation(); // Prevent card click when clicking RSVP buttons
    const token = localStorage.getItem("jwt");
    if (!token) return alert("Please login first.");
    try {
      await rsvp(event.id, status, token);
      alert("Saved");
    } catch (error) {
      console.error("RSVP failed:", error);
      alert("Failed to save RSVP: " + (error as Error).message);
    }
  };

  const handleCardClick = () => {
    router.push(`/event/${event.slug}`);
  };

  const img = event.image?.url ? getStrapiImageUrl(event.image.url) : undefined;

  return (
    <Card 
      className="group overflow-hidden relative border-0 bg-gradient-to-br from-background via-background to-muted/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Animated glow border */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="absolute inset-[1px] rounded-lg bg-background" />
      
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        {img ? (
          <Image 
            src={img} 
            alt={event.title} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-fuchsia-500/40 via-pink-500/30 to-sky-400/40 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-500" />
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              🎭
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-500" />
        
        {/* Floating title with better positioning */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white">
            <div className="font-bold text-base line-clamp-1 mb-1 group-hover:text-primary/90 transition-colors duration-300">
              {event.title}
            </div>
            <div className="opacity-90 line-clamp-1 text-sm flex items-center gap-1">
              <span className="inline-block w-3 h-3">📅</span>
              {new Date(event.startDate).toLocaleDateString()}
              {event.venue && (
                <>
                  <span className="inline-block w-3 h-3 ml-1">📍</span>
                  {event.venue.name}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating category badge */}
        {event.category && (
          <div className="absolute top-3 right-3">
            <Badge 
              variant="secondary" 
              className="bg-background/80 backdrop-blur-sm border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300"
            >
              {event.category.name}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="relative p-4 z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {event.attendanceCounts && (
              <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 border border-primary/20 group-hover:border-primary/40 px-3 py-1 text-xs font-medium transition-all duration-300">
                <span className="inline-block w-3 h-3">👥</span>
                {event.attendanceCounts.going} going
              </div>
            )}
          </div>
          <LikeButton eventId={event.id} />
        </div>
        {showActions && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105" 
              onClick={(e) => onRSVP(e, "going")}
            >
              ✓ Going
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary/30 hover:to-secondary/20 border border-secondary/30 hover:border-secondary/50 transition-all duration-300 hover:scale-105" 
              onClick={(e) => onRSVP(e, "maybe")}
            >
              ? Maybe
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-muted hover:bg-muted/50 hover:border-muted-foreground/30 transition-all duration-300 hover:scale-105" 
              onClick={(e) => onRSVP(e, "not_going")}
            >
              ✗ No
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


