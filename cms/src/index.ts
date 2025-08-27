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
      strapi.log.info('🚀 Starting Strapi bootstrap...');
      
      // Create basic categories only
      const docs = (uid: string) => strapi.documents(uid);
      
      const basicCategories = ['music', 'theatre', 'art', 'sports', 'festival', 'party', 'conference', 'meetup'];
      const createdCategories = {};
      
      for (const slug of basicCategories) {
        const name = slug.charAt(0).toUpperCase() + slug.slice(1);
        let category = await docs('api::category.category').findFirst({ filters: { slug } });
        if (!category) {
          category = await docs('api::category.category').create({ data: { name, slug }, status: 'published' });
          strapi.log.info(`✅ Created category: ${name}`);
        }
        createdCategories[slug] = category;
      }

      // Create basic venues
      let grandHall = await docs('api::venue.venue').findFirst({ filters: { name: 'Grand Hall' } });
      if (!grandHall) {
        grandHall = await docs('api::venue.venue').create({ 
          data: { name: 'Grand Hall', city: 'Prague', country: 'CZ' }, 
          status: 'published' 
        });
        strapi.log.info('✅ Created venue: Grand Hall');
      }

      let openAir = await docs('api::venue.venue').findFirst({ filters: { name: 'Open Air Arena' } });
      if (!openAir) {
        openAir = await docs('api::venue.venue').create({ 
          data: { name: 'Open Air Arena', city: 'Brno', country: 'CZ' }, 
          status: 'published' 
        });
        strapi.log.info('✅ Created venue: Open Air Arena');
      }

      // Create demo events
      const now = new Date();
      const today = new Date(now);
      today.setHours(19, 0, 0, 0);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(20, 0, 0, 0);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      nextWeek.setHours(18, 0, 0, 0);

      const demoEvents = [
        {
          slug: 'tonight-symphony-concert',
          title: 'Tonight Symphony Concert',
          description: '<p>Experience an evening of classical masterpieces performed by the Prague Symphony Orchestra.</p>',
          startDate: today,
          endDate: new Date(today.getTime() + 2 * 60 * 60 * 1000),
          venue: grandHall,
          category: createdCategories.music,
        },
        {
          slug: 'weekend-rock-festival',
          title: 'Weekend Rock Festival',
          description: '<p>Three days of amazing rock bands from across Europe. Food, drinks, and great atmosphere!</p>',
          startDate: tomorrow,
          endDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
          venue: openAir,
          category: createdCategories.festival,
        },
        {
          slug: 'modern-theatre-premiere',
          title: 'Modern Theatre Premiere',
          description: '<p>A captivating new production exploring contemporary themes with brilliant performances.</p>',
          startDate: nextWeek,
          endDate: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000),
          venue: grandHall,
          category: createdCategories.theatre,
        },
        {
          slug: 'tech-conference-2024',
          title: 'Tech Conference 2024',
          description: '<p>Join industry leaders discussing the latest trends in technology and innovation.</p>',
          startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
          venue: grandHall,
          category: createdCategories.conference,
        },
        {
          slug: 'art-gallery-opening',
          title: 'Contemporary Art Gallery Opening',
          description: '<p>Discover stunning contemporary artworks from local and international artists.</p>',
          startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          venue: grandHall,
          category: createdCategories.art,
        },
      ];

      for (const eventData of demoEvents) {
        const existing = await docs('api::event.event').findFirst({ filters: { slug: eventData.slug } });
        if (!existing) {
          await docs('api::event.event').create({
            data: {
              title: eventData.title,
              slug: eventData.slug,
              description: eventData.description,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              venue: { connect: [eventData.venue.documentId] },
              category: { connect: [eventData.category.documentId] },
            },
            status: 'published',
          });
          strapi.log.info(`✅ Created event: ${eventData.title}`);
        }
      }

      strapi.log.info('✅ Bootstrap completed successfully');
    } catch (error) {
      strapi.log.error('❌ Bootstrap failed:', error);
      // Don't throw error to prevent deployment failure
    }
  },
};
