const { assertRequiredEnv, env } = require('./config/env');

assertRequiredEnv();

const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`EduMap API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
}

start();
