export default {
  routes: [
    {
      method: 'GET',
      path: '/categories',
      handler: 'category.publicList',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};


