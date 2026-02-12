const prisma = require('./db');

// --- Prisma 4 Middleware patterns ---
// $use() is DEPRECATED in Prisma 5 — must migrate to Prisma Client Extensions

/**
 * Soft delete middleware.
 * Intercepts delete operations and converts them to updates.
 * In Prisma 5, this should use $extends with query component.
 */
prisma.$use(async (params, next) => {
  // Intercept delete on Post model — set deleted flag instead
  if (params.model === 'Post') {
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deleted: true };
    }
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data !== undefined) {
        params.args.data.deleted = true;
      } else {
        params.args.data = { deleted: true };
      }
    }
  }
  return next(params);
});

/**
 * Query logging middleware.
 * Logs duration of every database query.
 * In Prisma 5, this should use $extends with query component.
 */
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(
    `Query ${params.model}.${params.action} took ${after - before}ms`
  );
  return result;
});

/**
 * Auto-timestamp middleware.
 * Ensures updatedAt is set on every update.
 * Another pattern that needs migration to extensions in Prisma 5.
 */
prisma.$use(async (params, next) => {
  if (params.action === 'update' || params.action === 'updateMany') {
    if (params.args.data && !params.args.data.updatedAt) {
      params.args.data.updatedAt = new Date();
    }
  }
  return next(params);
});

module.exports = prisma;
