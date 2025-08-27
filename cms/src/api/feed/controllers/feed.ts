import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::feed.feed', ({ strapi }) => ({
  async sync(ctx) {
    const { ids } = ctx.request.body || {};
    const service = strapi.service('api::feed.feed');
    const result = await service.syncFeeds(ids);
    ctx.body = { synced: result };
  },
}));

