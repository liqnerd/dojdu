export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://dojdu.vercel.app', 
        'https://dojdu-an0fvd2e6-polaklxx-4230s-projects.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        /https:\/\/dojdu.*\.vercel\.app$/
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
