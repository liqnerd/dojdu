export default {
  routes: [
    {
      method: 'POST',
      path: '/attendances/rsvp',
      handler: 'attendance.rsvp',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/attendances/me',
      handler: 'attendance.me',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

