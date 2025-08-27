export default {
  routes: [
    {
      method: 'POST',
      path: '/attendances/rsvp',
      handler: 'attendance.rsvp',
      config: {
        policies: [],
        middlewares: [],
        auth: true,
      },
    },
    {
      method: 'GET',
      path: '/attendances/me',
      handler: 'attendance.me',
      config: {
        policies: [],
        middlewares: [],
        auth: true,
      },
    },
  ],
};

