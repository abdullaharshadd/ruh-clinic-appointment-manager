import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';

// Load swagger.json file from project root
const swaggerJsonPath = path.join(__dirname, '../../swagger.json');
let swaggerSpec: any;

try {
  const swaggerJson = fs.readFileSync(swaggerJsonPath, 'utf8');
  swaggerSpec = JSON.parse(swaggerJson);
  console.log('📚 Swagger specification loaded from swagger.json');
} catch (error) {
  console.error('❌ Could not load swagger.json file:', (error as Error).message);
  console.log('Make sure swagger.json exists in the project root directory');
  
  // Basic fallback if file is not found
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Wellness Platform API',
      version: '1.0.0',
      description: 'API documentation for the Wellness Platform (swagger.json not found)',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {}
  };
}

// Swagger UI options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1f2937; }
    .swagger-ui .info .description { color: #4b5563; }
    .swagger-ui .scheme-container { background: #f9fafb; }
  `,
  customSiteTitle: 'Wellness Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
};

export const setupSwagger = (app: Express): void => {
  // Update server URLs based on environment
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.API_URL || 'https://your-production-domain.com/api'
    : 'http://localhost:5000/api';
  
  swaggerSpec.servers = [
    {
      url: baseUrl,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ];

  // Serve swagger documentation at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
  
  // Serve raw swagger.json at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  const port = process.env.PORT || 5000;
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api-docs`);
  console.log(`📄 Swagger JSON available at: http://localhost:${port}/api-docs.json`);
};

export { swaggerSpec };