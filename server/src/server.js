import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 LMS Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`🔗 Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
