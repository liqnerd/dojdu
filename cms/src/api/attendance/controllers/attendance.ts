import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::attendance.attendance', ({ strapi }) => ({
  async rsvp(ctx) {
    console.log('RSVP endpoint called with:', ctx.request.body);
    const { eventId, status } = ctx.request.body;

    if (!eventId || !['going', 'maybe', 'not_going'].includes(status)) {
      console.log('Invalid payload:', { eventId, status });
      return ctx.badRequest('Invalid payload');
    }

    if (!ctx.state.user) {
      console.log('No authenticated user found');
      return ctx.unauthorized('Authentication required');
    }

    const userId = ctx.state.user.id;

    const existing = await strapi.entityService.findMany('api::attendance.attendance', {
      filters: { user: userId, event: eventId },
      limit: 1,
    });

    let result;
    if (existing && existing.length > 0) {
      const attendanceId = existing[0].id;
      result = await strapi.entityService.update('api::attendance.attendance', attendanceId, {
        data: { status },
      });
    } else {
      result = await strapi.entityService.create('api::attendance.attendance', {
        data: {
          status,
          user: userId,
          event: eventId,
        },
      });
    }

    ctx.body = result;
  },

  async me(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Authentication required');
    const userId = ctx.state.user.id;
    const items = await strapi.entityService.findMany('api::attendance.attendance', {
      filters: { user: userId },
      populate: ['event', 'event.venue', 'event.category', 'event.image'],
      sort: { createdAt: 'desc' },
      limit: 100,
    });
    // Filter out orphaned RSVPs (event deleted) and attach counts
    const valid = items.filter((a: any) => a.event && a.event.id);
    const withCounts = await Promise.all(valid.map(async (a: any) => {
      const e = a.event;
      if (!e || !e.id) return null;
      const going = await strapi.query('api::attendance.attendance').count({ where: { event: e.id, status: 'going' } });
      const maybe = await strapi.query('api::attendance.attendance').count({ where: { event: e.id, status: 'maybe' } });
      const notGoing = await strapi.query('api::attendance.attendance').count({ where: { event: e.id, status: 'not_going' } });
      return { ...a, event: { ...e, attendanceCounts: { going, maybe, not_going: notGoing } } };
    }));
    ctx.body = withCounts.filter(Boolean);
  },
}));

