export default {
  routes: [
    {
      method: 'POST',
      path: '/feeds/sync',
      handler: 'feed.sync',
      config: { policies: [], middlewares: [] },
    },
  ],
};

