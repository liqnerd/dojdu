// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap: async ({ strapi }: { strapi: any }) => {
    try {
      strapi.log.info('🚀 Starting Strapi bootstrap with demo content...');
      
      const docs = (uid: string) => strapi.documents(uid);
      
      // Create comprehensive categories
      const categories = [
        // Music & Entertainment
        { name: 'Concert', slug: 'concert' },
        { name: 'Festival', slug: 'festival' },
        { name: 'Opera', slug: 'opera' },
        { name: 'Theatre', slug: 'theatre' },
        { name: 'Comedy Show', slug: 'comedy-show' },
        { name: 'Dance Performance', slug: 'dance-performance' },
        { name: 'Jazz', slug: 'jazz' },
        { name: 'Classical Music', slug: 'classical-music' },
        { name: 'Rock Concert', slug: 'rock-concert' },
        { name: 'Electronic Music', slug: 'electronic-music' },
        
        // Arts & Culture
        { name: 'Art Exhibition', slug: 'art-exhibition' },
        { name: 'Museum Event', slug: 'museum-event' },
        { name: 'Gallery Opening', slug: 'gallery-opening' },
        { name: 'Film Screening', slug: 'film-screening' },
        { name: 'Book Reading', slug: 'book-reading' },
        
        // Sports & Activities
        { name: 'Sports Event', slug: 'sports-event' },
        { name: 'Fitness Class', slug: 'fitness-class' },
        { name: 'Yoga Session', slug: 'yoga-session' },
        { name: 'Running Event', slug: 'running-event' },
        { name: 'Outdoor Activity', slug: 'outdoor-activity' },
        
        // Business & Professional
        { name: 'Conference', slug: 'conference' },
        { name: 'Workshop', slug: 'workshop' },
        { name: 'Networking Event', slug: 'networking-event' },
        { name: 'Seminar', slug: 'seminar' },
        { name: 'Startup Event', slug: 'startup-event' },
        { name: 'Tech Meetup', slug: 'tech-meetup' },
        
        // Social & Community
        { name: 'Community Event', slug: 'community-event' },
        { name: 'Charity Event', slug: 'charity-event' },
        { name: 'Food & Drink', slug: 'food-drink' },
        { name: 'Wine Tasting', slug: 'wine-tasting' },
        { name: 'Cooking Class', slug: 'cooking-class' },
        
        // Private Events
        { name: 'Birthday Party', slug: 'birthday-party' },
        { name: 'Wedding', slug: 'wedding' },
        { name: 'Team Building', slug: 'team-building' },
        { name: 'Corporate Event', slug: 'corporate-event' },
        { name: 'Private Party', slug: 'private-party' },
        { name: 'Anniversary', slug: 'anniversary' },
        
        // Family & Kids
        { name: 'Family Event', slug: 'family-event' },
        { name: 'Kids Event', slug: 'kids-event' },
        { name: 'Educational Event', slug: 'educational-event' },
      ];
      
      const createdCategories = {};
      for (const cat of categories) {
        let category = await docs('api::category.category').findFirst({ filters: { slug: cat.slug } });
        if (!category) {
          category = await docs('api::category.category').create({ 
            data: { name: cat.name, slug: cat.slug }, 
            status: 'published' 
          });
          strapi.log.info(`✅ Created category: ${cat.name}`);
        }
        createdCategories[cat.slug] = category;
      }
      
      // Create city-based venues (no specific venue names)
      const cities = [
        { city: 'Prague', country: 'CZ' },
        { city: 'Brno', country: 'CZ' },
        { city: 'Bratislava', country: 'SK' },
        { city: 'Vienna', country: 'AT' },
        { city: 'Berlin', country: 'DE' },
        { city: 'Warsaw', country: 'PL' },
        { city: 'Budapest', country: 'HU' },
        { city: 'Munich', country: 'DE' },
      ];
      
      const createdVenues = {};
      for (const cityData of cities) {
        let venue = await docs('api::venue.venue').findFirst({ 
          filters: { city: cityData.city, country: cityData.country } 
        });
        if (!venue) {
          venue = await docs('api::venue.venue').create({ 
            data: { 
              name: `${cityData.city} Event Venue`,
              city: cityData.city, 
              country: cityData.country 
            }, 
            status: 'published' 
          });
          strapi.log.info(`✅ Created venue: ${cityData.city}`);
        }
        createdVenues[cityData.city] = venue;
      }
      
      // Create demo events for each category (3-4 per category)
      const now = new Date();
      const venueKeys = Object.keys(createdVenues);
      let eventCounter = 0;
      
      for (const [categorySlug, category] of Object.entries(createdCategories)) {
        const eventsPerCategory = 3;
        
        for (let i = 0; i < eventsPerCategory; i++) {
          eventCounter++;
          const dayOffset = (eventCounter % 30) + 1; // Spread over next month
          const startDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
          startDate.setHours(19 + (i % 3), 0, 0, 0); // Vary start times
          const endDate = new Date(startDate.getTime() + (2 + i) * 60 * 60 * 1000); // 2-4 hour events
          
          const venueCity = venueKeys[eventCounter % venueKeys.length];
          const venue = createdVenues[venueCity];
          
          const eventTitles = {
            'concert': ['Live Music Night', 'Acoustic Session', 'Band Performance'],
            'festival': ['Summer Festival', 'Music & Arts Festival', 'Cultural Festival'],
            'opera': ['Classic Opera Night', 'Modern Opera Performance', 'Opera Gala'],
            'theatre': ['Drama Performance', 'Musical Theatre', 'Contemporary Play'],
            'comedy-show': ['Stand-up Comedy', 'Comedy Night', 'Improv Show'],
            'conference': ['Tech Conference', 'Business Summit', 'Innovation Forum'],
            'workshop': ['Creative Workshop', 'Skill Building Session', 'Hands-on Training'],
            'birthday-party': ['Birthday Celebration', 'Birthday Bash', 'Birthday Gathering'],
            'team-building': ['Team Building Day', 'Corporate Retreat', 'Team Activities'],
            'art-exhibition': ['Art Gallery Opening', 'Contemporary Art Show', 'Artist Showcase'],
          };
          
          const titles = eventTitles[categorySlug] || ['Special Event', 'Community Gathering', 'Social Event'];
          const title = `${titles[i % titles.length]} in ${venueCity}`;
          
          const slug = `${categorySlug}-${venueCity.toLowerCase()}-${i + 1}-${eventCounter}`;
          
          const existing = await docs('api::event.event').findFirst({ filters: { slug } });
          if (!existing) {
            const isPrivateCategory = ['birthday-party', 'wedding', 'team-building', 'corporate-event', 'private-party', 'anniversary'].includes(categorySlug);
            
            await docs('api::event.event').create({
              data: {
                title,
                slug,
                description: `<p>Join us for an amazing ${(category as any).name.toLowerCase()} experience in ${venueCity}. This event promises to be unforgettable with great atmosphere, wonderful people, and memorable moments.</p>`,
                startDate,
                endDate,
                isPrivate: isPrivateCategory,
                accessCode: isPrivateCategory ? `${categorySlug}${i + 1}` : undefined,
                venue: { connect: [venue.documentId] },
                category: { connect: [(category as any).documentId] },
              },
              status: 'published',
            });
          }
        }
      }
      
      strapi.log.info('✅ Bootstrap completed successfully with demo content');
    } catch (error) {
      strapi.log.error('❌ Bootstrap failed:', error);
      // Don't throw error to prevent deployment failure
    }
  },
};
