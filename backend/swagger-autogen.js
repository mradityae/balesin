const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'BalesinAI API Documentation',
    version: '1.0.0',
    description: 'Dokumentasi API otomatis BalesinAI',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT Anda di sini (Cukup 1x untuk semua endpoint)',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger-output.json';
const routes = ['./app.js']; // Membaca langsung semua app.use di app.js

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log('📄 File swagger-output.json berhasil diperbarui dengan format OpenAPI 3.0!');
});