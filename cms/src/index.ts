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
    const docs = (uid: string) => strapi.documents(uid);

    // Upsert categories
    const music =
      (await docs('api::category.category').findFirst({ filters: { slug: 'music' } })) ||
      (await docs('api::category.category').create({ data: { name: 'Music', slug: 'music' }, status: 'published' }));
    const theatre =
      (await docs('api::category.category').findFirst({ filters: { slug: 'theatre' } })) ||
      (await docs('api::category.category').create({ data: { name: 'Theatre', slug: 'theatre' }, status: 'published' }));
    const seededCats = [
      'festival','party','conference','meetup','workshop','startup','tech','opera','classical','jazz','rock',
      'electronic','hiphop','theater','standup','movie','exhibition','art','family','kids','sports','football',
      'basketball','running','fitness','yoga','dance','networking','education','language','food','wine','beer',
      'outdoor','hiking','travel','charity','fundraiser','community','gaming','esports','boardgames','pubquiz',
      'hackathon','team-building','private','birthday','wedding','bachelor','bachelorette'
    ];
    for (const slug of seededCats) {
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const exist = await docs('api::category.category').findFirst({ filters: { slug } });
      if (!exist) {
        await docs('api::category.category').create({ data: { name, slug }, status: 'published' });
      }
    }

    // Upsert venues
    const hall =
      (await docs('api::venue.venue').findFirst({ filters: { name: 'Grand Hall' } })) ||
      (await docs('api::venue.venue').create({ data: { name: 'Grand Hall', city: 'Prague', country: 'CZ' }, status: 'published' }));
    const openAir =
      (await docs('api::venue.venue').findFirst({ filters: { name: 'Open Air Arena' } })) ||
      (await docs('api::venue.venue').create({ data: { name: 'Open Air Arena', city: 'Brno', country: 'CZ' }, status: 'published' }));

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(19, 0, 0, 0);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upsertEvent = async (
      slug: string,
      data: { title: string; description: string; startDate: Date; endDate?: Date; venueDocId: string; categoryDocId: string }
    ) => {
      const existing = await docs('api::event.event').findFirst({ filters: { slug } });
      const payload = {
        data: {
          title: data.title,
          slug,
          description: data.description,
          startDate: data.startDate,
          ...(data.endDate ? { endDate: data.endDate } : {}),
          venue: { connect: [data.venueDocId] },
          category: { connect: [data.categoryDocId] },
        },
        status: 'published' as const,
      };
      if (existing) {
        await docs('api::event.event').update({ documentId: existing.documentId, ...payload });
      } else {
        await docs('api::event.event').create(payload);
      }
    };

    await upsertEvent('tonight-symphony-orchestra', {
      title: 'Tonight Symphony Orchestra',
      description: '<p>Experience a night of classical masterpieces.</p>',
      startDate: todayStart,
      endDate: new Date(todayStart.getTime() + 2 * 60 * 60 * 1000),
      venueDocId: hall.documentId,
      categoryDocId: music.documentId,
    });

    await upsertEvent('open-air-rock-concert', {
      title: 'Open Air Rock Concert',
      description: '<p>Rock bands under the stars.</p>',
      startDate: tomorrow,
      venueDocId: openAir.documentId,
      categoryDocId: music.documentId,
    });

    await upsertEvent('modern-theatre-premiere', {
      title: 'Modern Theatre Premiere',
      description: '<p>A captivating new production.</p>',
      startDate: nextWeek,
      venueDocId: hall.documentId,
      categoryDocId: theatre.documentId,
    });

    // Create a few demo events for each category
    const categoryDocs = await docs('api::category.category').findMany({ limit: 200 });
    const suffixes = [' Bash', ' Showcase', ' Meetup', ' Gala'];
    let seedIndex = 1;
    for (const cat of categoryDocs) {
      for (let i = 0; i < 3; i++) {
        const dayOffset = (seedIndex % 20) + i; // spread across next ~3 weeks
        const start = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        start.setHours(19, 0, 0, 0);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const baseSlug = cat.slug || (cat as any).name?.toLowerCase()?.replace(/\s+/g, '-');
        const slug = `${baseSlug}-demo-${i + 1}`;
        const existing = await docs('api::event.event').findFirst({ filters: { slug } });
        if (!existing) {
          await docs('api::event.event').create({
            data: {
              title: `${(cat as any).name}${suffixes[i % suffixes.length]}`,
              slug,
              description: `<p>Demo ${cat.name} event with full details, venue, and timing. Invite friends and RSVP.</p>`,
              startDate: start,
              endDate: end,
              isPrivate: cat.slug === 'private' || cat.slug === 'team-building',
              venue: { connect: [seedIndex % 2 === 0 ? hall.documentId : openAir.documentId] },
              category: { connect: [cat.documentId] },
            },
            status: 'published',
          });
        }
      }
      seedIndex++;
    }

    // Upsert a public ICS feed and trigger sync once on first boot
    try {
      const existingFeed = await strapi.entityService.findMany('api::feed.feed', {
        filters: { url: 'https://www.google.com/calendar/ical/praguepig%40gmail.com/public/basic.ics' },
        limit: 1,
      });
      const feed = existingFeed && existingFeed[0]
        ? existingFeed[0]
        : await strapi.entityService.create('api::feed.feed', {
            data: {
              name: 'PraguePig.com',
              url: 'https://www.google.com/calendar/ical/praguepig%40gmail.com/public/basic.ics',
              city: 'Prague',
              country: 'CZ',
              enabled: true,
            },
          });
      if (feed && feed.id) {
        await strapi.service('api::feed.feed').syncFeeds([feed.id]);
      }
    } catch (e) {
      strapi.log.warn('Feed bootstrap failed');
    }
  },
};
