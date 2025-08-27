"use client";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RSVPStatus, EventItem, getStrapiImageUrl, rsvp } from "@/lib/api";
import { useMemo } from "react";

type Props = {
  event: EventItem;
  showActions?: boolean;
};

export default function ChaoticEventCard({ event, showActions }: Props) {
  // Generate consistent random tilt for this specific event
  const randomTilt = useMemo(() => {
    // Use event ID as seed for consistent randomness
    const seed = event.id * 7919; // Prime number for better distribution
    const random = Math.sin(seed) * 10000;
    const tilt = (random - Math.floor(random)) * 12 - 6; // Random between -6 and +6 degrees
    return tilt;
  }, [event.id]);

  const onRSVP = async (status: RSVPStatus) => {
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

  const img = event.image?.url ? getStrapiImageUrl(event.image.url) : undefined;

  return (
    <div 
      className="group transition-all duration-300 hover:scale-105 hover:z-10 relative"
      style={{ 
        transform: `rotate(${randomTilt}deg)`,
        transformOrigin: 'center center'
      }}
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2">
        <div className="relative h-48 w-full">
          {img ? (
            <Image src={img} alt={event.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-fuchsia-500/30 via-pink-500/20 to-sky-400/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-white text-sm">
              <div className="font-semibold line-clamp-1">{event.title}</div>
              <div className="opacity-90 line-clamp-1">
                {new Date(event.startDate).toLocaleString()} {event.venue ? `• ${event.venue.name}` : ""}
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {event.attendanceCounts && (
                <span className="rounded-full bg-foreground/10 text-foreground px-2 py-0.5 text-xs">
                  {event.attendanceCounts.going} going
                </span>
              )}
              {event.category && <Badge variant="secondary">{event.category.name}</Badge>}
            </div>
            <Link href={`/event/${event.slug}`} className="text-sm text-primary hover:underline">Details</Link>
          </div>
          {showActions && (
            <div className="flex gap-1 mt-2">
              <Button size="sm" className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:brightness-110" onClick={() => onRSVP("going")}>Going</Button>
              <Button size="sm" variant="secondary" className="hover:brightness-110" onClick={() => onRSVP("maybe")}>Maybe</Button>
              <Button size="sm" variant="outline" className="hover:bg-sky-50 dark:hover:bg-sky-950/30" onClick={() => onRSVP("not_going")}>No</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
