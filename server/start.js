const startServer = require('./server');

const start = async () => {
  const server = await startServer();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
  });
};

start();