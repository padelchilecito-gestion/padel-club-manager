module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // Para cargar .env en los tests
  // Opcional: Ignorar tests específicos
  testPathIgnorePatterns: ['/node_modules/'],
  // Opcional: Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/tests/**'],
};