const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../../swagger-output.json');

const swaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  console.log('📄 Swagger UI aktif di http://localhost:5000/api-docs');
};

module.exports = { swaggerDocs };