const prisma = require('./db');

// --- Data Access Layer using Prisma 4 patterns ---

/**
 * Get all users with their posts eagerly loaded.
 * Standard findMany with include — works in both Prisma 4 and 5.
 */
async function getAllUsersWithPosts() {
  return prisma.user.findMany({
    include: {
      posts: {
        where: { published: true },
        include: {
          categories: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single user by ID.
 * Uses rejectOnNotFound: true — REMOVED in Prisma 5.
 * Prisma 5 requires using findUniqueOrThrow() instead.
 */
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    rejectOnNotFound: true,
  });
}

/**
 * Get a single post by ID with rejectOnNotFound.
 * Another usage of the deprecated option.
 */
async function getPostById(id) {
  return prisma.post.findFirst({
    where: { id, deleted: false },
    rejectOnNotFound: true,
    include: {
      author: true,
      categories: true,
    },
  });
}

/**
 * Group posts by published status and count.
 * groupBy works in both versions but syntax refined in Prisma 5.
 */
async function getPostStats() {
  return prisma.post.groupBy({
    by: ['published'],
    _count: { id: true },
    _avg: { authorId: true },
    where: { deleted: false },
  });
}

/**
 * Interactive transaction — transfer post ownership.
 * $transaction with callback works in both versions.
 */
async function transferPosts(fromUserId, toUserId) {
  return prisma.$transaction(async (tx) => {
    const posts = await tx.post.findMany({
      where: { authorId: fromUserId },
    });

    for (const post of posts) {
      await tx.post.update({
        where: { id: post.id },
        data: { authorId: toUserId },
      });
    }

    return posts.length;
  });
}

/**
 * Create a post with category connections.
 * Uses nested create/connect — works in both versions.
 */
async function createPost(title, content, authorId, categoryIds) {
  return prisma.post.create({
    data: {
      title,
      content,
      author: { connect: { id: authorId } },
      categories: {
        connect: categoryIds.map((id) => ({ id })),
      },
    },
    include: {
      author: true,
      categories: true,
    },
  });
}

module.exports = {
  getAllUsersWithPosts,
  getUserById,
  getPostById,
  getPostStats,
  transferPosts,
  createPost,
};
