import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
  async publicList(ctx) {
    const items = await strapi.entityService.findMany('api::category.category', {
      sort: { name: 'asc' },
      fields: ['id', 'name', 'slug'],
      limit: 500,
    });
    ctx.body = items;
  },
}));


