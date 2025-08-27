import Image from "next/image";
import { ClientFeatured, ClientNearYou, ClientPopular, ClientSponsored, ClientByCategories } from './client-sections';

export default function HomePage() {
  // Debug environment variable
  console.log('STRAPI URL:', process.env.NEXT_PUBLIC_STRAPI_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  return (
    <div className="space-y-10">
      {/* Debug info - remove this later */}
      <div className="bg-yellow-100 p-4 rounded border">
        <p><strong>Debug Info:</strong></p>
        <p>STRAPI URL: {process.env.NEXT_PUBLIC_STRAPI_URL || 'NOT SET'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV || 'NOT SET'}</p>
      </div>
      
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-fuchsia-500/10 via-sky-400/10 to-pink-500/10">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative p-10 md:p-16">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Discover events around you</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Concerts, theatre, opera, private parties and team buildings across Central Europe. Plan with friends and RSVP in one click.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/today" className="inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium bg-white/70 dark:bg-white/10 backdrop-blur hover:bg-white/90 dark:hover:bg-white/20 transition-colors">Today</a>
            <a href="/upcoming" className="inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium bg-white/70 dark:bg-white/10 backdrop-blur hover:bg-white/90 dark:hover:bg-white/20 transition-colors">Upcoming</a>
            <a href="/all" className="inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium bg-white/70 dark:bg-white/10 backdrop-blur hover:bg-white/90 dark:hover:bg-white/20 transition-colors">All events</a>
          </div>
        </div>
      </section>

      {/* Featured / Main events */}
      <ClientFeatured />

      {/* Sponsored slider */}
      <ClientSponsored />

      {/* Near you */}
      <ClientNearYou />

      {/* Popular */}
      <ClientPopular />

      {/* Categories */}
      <ClientByCategories />
    </div>
  );
}
