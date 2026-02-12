const { PrismaClient } = require('@prisma/client');

// Prisma 4 client initialization with query logging
const prisma = new PrismaClient({
  log: ['query'],
});

module.exports = prisma;
