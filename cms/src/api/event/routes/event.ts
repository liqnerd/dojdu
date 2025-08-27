export default {
  routes: [
    {
      method: 'GET',
      path: '/events/all',
      handler: 'event.all',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/events/today',
      handler: 'event.today',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/events/upcoming',
      handler: 'event.upcoming',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/events/by-slug/:slug',
      handler: 'event.bySlug',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/events/create',
      handler: 'event.createEvent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/events/mine',
      handler: 'event.mine',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/events/:id',
      handler: 'event.updateOwn',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/events/:id',
      handler: 'event.deleteOwn',
      config: { policies: [], middlewares: [] },
    },
  ],
};

