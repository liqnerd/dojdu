import { factories } from '@strapi/strapi';
import ical from 'node-ical';

export default factories.createCoreService('api::feed.feed', ({ strapi }) => ({
  async syncFeeds(ids?: number[]) {
    const feeds = await strapi.entityService.findMany('api::feed.feed', {
      filters: { enabled: true, ...(ids && ids.length ? { id: { $in: ids } } : {}) },
      limit: 100,
    });

    const results: any[] = [];
    for (const feed of feeds) {
      try {
        const data = await ical.async.fromURL(feed.url);
        for (const key of Object.keys(data)) {
          const item: any = (data as any)[key];
          if (item.type !== 'VEVENT') continue;
          const externalId = item.uid || `${feed.url}#${key}`;
          const title = item.summary || 'Untitled';
          const start = item.start ? new Date(item.start) : undefined;
          if (!start) continue;

          const existing = await strapi.documents('api::event.event').findFirst({
            filters: { source: 'ics', externalId },
          });

          const payload = {
            data: {
              title,
              slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100),
              description: item.description || '',
              startDate: start,
              endDate: item.end ? new Date(item.end) : undefined,
              source: 'ics',
              externalId,
              raw: item,
            },
            status: 'published' as const,
          };

          if (existing) {
            await strapi.documents('api::event.event').update({ documentId: (existing as any).documentId, ...payload });
          } else {
            await strapi.documents('api::event.event').create(payload);
          }
        }
        results.push({ feed: feed.id, ok: true });
        await strapi.entityService.update('api::feed.feed', feed.id, { data: { lastSyncedAt: new Date() } });
      } catch (e) {
        strapi.log.error(`Feed sync failed id=${feed.id}: ${e}`);
        results.push({ feed: feed.id, ok: false });
      }
    }
    return results;
  },
}));

