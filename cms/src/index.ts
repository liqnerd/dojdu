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
      strapi.log.info('🚀 Starting minimal Strapi bootstrap...');
      
      // Just log that bootstrap started - no complex operations
      strapi.log.info('✅ Bootstrap completed successfully');
    } catch (error) {
      strapi.log.error('❌ Bootstrap failed:', error);
      // Don't throw error to prevent deployment failure
    }
  },
};
