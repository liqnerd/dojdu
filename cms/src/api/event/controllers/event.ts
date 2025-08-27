import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::event.event', ({ strapi }) => ({
  async withCounts(event: any) {
    const going = await strapi.query('api::attendance.attendance').count({ where: { event: event.id, status: 'going' } });
    const maybe = await strapi.query('api::attendance.attendance').count({ where: { event: event.id, status: 'maybe' } });
    const notGoing = await strapi.query('api::attendance.attendance').count({ where: { event: event.id, status: 'not_going' } });
    return { ...event, attendanceCounts: { going, maybe, not_going: notGoing } };
  },
  async all(ctx) {
    const { from, to, category, city, q } = ctx.request.query as Record<string, string>;
    const filters: any = { isPrivate: false };
    if (from) filters.startDate = { ...(filters.startDate || {}), $gte: new Date(from) };
    if (to) filters.startDate = { ...(filters.startDate || {}), $lte: new Date(to) };
    if (category) filters.category = { slug: category };
    if (city) filters.venue = { city: { $containsi: city } };
    if (q) filters.$or = [{ title: { $containsi: q } }, { description: { $containsi: q } }];
    const raw = await strapi.entityService.findMany('api::event.event', {
      filters,
      populate: ['venue', 'category', 'image'],
      sort: { startDate: 'desc' },
      limit: 200,
    });
    const data = await Promise.all(raw.map((e: any) => this.withCounts(e)));
    ctx.body = data;
  },
  async today(ctx) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { category, city, q } = ctx.request.query as Record<string, string>;

    const filters: any = {
      $and: [
        { startDate: { $gte: start } },
        { startDate: { $lte: end } },
      ],
    };
    filters.isPrivate = false;

    if (category) filters.category = { slug: category };
    if (city) filters.venue = { city: { $containsi: city } };
    if (q) filters.$or = [{ title: { $containsi: q } }, { description: { $containsi: q } }];

    const raw = await strapi.entityService.findMany('api::event.event', {
      filters,
      populate: ['venue', 'category', 'image'],
      sort: { startDate: 'asc' },
    });
    const data = await Promise.all(raw.map((e: any) => this.withCounts(e)));
    ctx.body = data;
  },

  async upcoming(ctx) {
    const now = new Date();
    const { from, to, category, city, q } = ctx.request.query as Record<string, string>;
    const filters: any = { startDate: { $gt: now }, isPrivate: false };
    if (from) filters.startDate = { ...(filters.startDate || {}), $gte: new Date(from) };
    if (to) filters.startDate = { ...(filters.startDate || {}), $lte: new Date(to) };
    if (category) filters.category = { slug: category };
    if (city) filters.venue = { city: { $containsi: city } };
    if (q) filters.$or = [{ title: { $containsi: q } }, { description: { $containsi: q } }];

    const raw = await strapi.entityService.findMany('api::event.event', {
      filters,
      populate: ['venue', 'category', 'image'],
      sort: { startDate: 'asc' },
    });
    const data = await Promise.all(raw.map((e: any) => this.withCounts(e)));
    ctx.body = data;
  },

  async bySlug(ctx) {
    const { slug } = ctx.params as { slug: string };
    // Use document API to ensure populated relations when using documentId
    const doc = await strapi.documents('api::event.event').findFirst({
      filters: { slug },
      populate: ['venue', 'category', 'image', 'attendances', 'owner'],
    });
    if (!doc) return ctx.notFound('Event not found');
    if (doc.isPrivate) {
      const code = (ctx.request.query as any)?.code || ctx.request.headers['x-event-code'];
      if (!code || code !== doc.accessCode) return ctx.forbidden('Invite required');
    }
    const withCounts = await this.withCounts(doc);
    ctx.body = withCounts;
  },

  async createEvent(ctx) {
    const user = ctx.state.user; // optional; we allow public for now
    const body = ctx.request.body as any;
    if (!body?.title) return ctx.badRequest('title is required');
    if (!body?.startDate) return ctx.badRequest('startDate is required');
    const toSlug = (s: string) => s
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = body.slug && typeof body.slug === 'string' && body.slug.trim().length > 0 ? body.slug : toSlug(body.title);
    const startIso = new Date(body.startDate).toISOString();
    const endIso = body.endDate ? new Date(body.endDate).toISOString() : null;
    const data: any = {
      title: body.title,
      slug,
      description: body.description || '',
      startDate: startIso,
      ...(endIso ? { endDate: endIso } : {}),
      isPrivate: !!body.isPrivate,
      accessCode: body.isPrivate ? (body.accessCode || Math.random().toString(36).slice(2, 8)) : null,
      ...(user ? { owner: user.id } : {}),
    };
    if (body.categoryId) data.category = body.categoryId;
    if (body.imageId) data.image = body.imageId;

    const created = await strapi.entityService.create('api::event.event', { data });
    ctx.body = created;
  },
  async mine(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Authentication required');
    const events = await strapi.entityService.findMany('api::event.event', {
      filters: { owner: ctx.state.user.id },
      populate: ['venue','category','image'],
      sort: { createdAt: 'desc' },
      limit: 200,
    });
    ctx.body = events;
  },
  async updateOwn(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Authentication required');
    const id = Number(ctx.params.id);
    const existing: any = await strapi.entityService.findOne('api::event.event', id, { populate: ['owner'] });
    if (!existing) return ctx.notFound('Event not found');
    if (!existing.owner || existing.owner.id !== ctx.state.user.id) return ctx.forbidden('Not your event');
    const body = ctx.request.body as any;
    const data: any = {};
    if (typeof body.title === 'string' && body.title.trim().length > 0) data.title = body.title.trim();
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.endDate === '') data.endDate = null;
    else if (body.endDate) data.endDate = new Date(body.endDate).toISOString();
    if (body.categoryId) data.category = body.categoryId;
    if (body.imageId === null) data.image = null;
    else if (body.imageId) data.image = body.imageId;
    if (body.city) {
      try {
        const existingVenue = await strapi.entityService.findMany('api::venue.venue', { filters: { city: body.city }, limit: 1 });
        let venueId = existingVenue?.[0]?.id;
        if (!venueId) {
          const createdVenue = await strapi.entityService.create('api::venue.venue', { data: { name: body.city, city: body.city, country: body.country || undefined } });
          venueId = createdVenue.id;
        }
        if (venueId) data.venue = venueId;
      } catch {}
    }
    const updated = await strapi.entityService.update('api::event.event', id, { data });
    ctx.body = updated;
  },
  async deleteOwn(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Authentication required');
    const id = Number(ctx.params.id);
    const existing: any = await strapi.entityService.findOne('api::event.event', id, { populate: ['owner'] });
    if (!existing) return ctx.notFound('Event not found');
    if (!existing.owner || existing.owner.id !== ctx.state.user.id) return ctx.forbidden('Not your event');
    await strapi.entityService.delete('api::event.event', id);
    ctx.body = { ok: true };
  },
}));

