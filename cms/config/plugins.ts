export default () => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d',
      },
    },
  },
  cron: {
    jobs: [
      {
        key: 'sync-feeds-hourly',
        schedule: '0 * * * *',
        task: ({ strapi }) => strapi.service('api::feed.feed').syncFeeds(),
      },
    ],
  },
});
