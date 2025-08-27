export default {
  routes: [
    {
      method: 'POST',
      path: '/attendances/rsvp',
      handler: 'attendance.rsvp',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/attendances/me',
      handler: 'attendance.me',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

