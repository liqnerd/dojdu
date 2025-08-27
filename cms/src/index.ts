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
      
      const basicCategories = ['music', 'theatre', 'art', 'sports'];
      for (const slug of basicCategories) {
        const name = slug.charAt(0).toUpperCase() + slug.slice(1);
        const exist = await docs('api::category.category').findFirst({ filters: { slug } });
        if (!exist) {
          await docs('api::category.category').create({ data: { name, slug }, status: 'published' });
          strapi.log.info(`✅ Created category: ${name}`);
        }
      }

      // Create basic venues
      const hallExists = await docs('api::venue.venue').findFirst({ filters: { name: 'Grand Hall' } });
      if (!hallExists) {
        await docs('api::venue.venue').create({ 
          data: { name: 'Grand Hall', city: 'Prague', country: 'CZ' }, 
          status: 'published' 
        });
        strapi.log.info('✅ Created venue: Grand Hall');
      }

      strapi.log.info('✅ Bootstrap completed successfully');
    } catch (error) {
      strapi.log.error('❌ Bootstrap failed:', error);
      // Don't throw error to prevent deployment failure
    }
  },
};
