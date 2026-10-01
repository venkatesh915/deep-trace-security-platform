const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  DEEP TRACE CYBERNETICS SECURITY PLATFORM API RUNNING `);
  console.log(`  Port:             ${PORT}`);
  console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Swagger Docs:     http://localhost:${PORT}/api-docs`);
  console.log(`  Health Check:     http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database connection disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if connections don't drain
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
