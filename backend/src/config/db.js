const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('[Database] SQL Database Connected via Prisma Engine.');
  } catch (error) {
    console.error(`[Database Error] SQL connection failed: ${error.message}`);
  }
};

module.exports = { prisma, connectDB };
