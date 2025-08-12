import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const applySwagger = (app: INestApplication): void => {
  const appName = process.env.APP_NAME;
  const appVersion = process.env.APP_VERSION;

  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${appName}`)
    .setDescription(`API`)
    .setVersion(`${appVersion}`)
    .addBearerAuth()
    .addBasicAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`api/${appVersion}/swagger`, app, document, {
    customSiteTitle: `${appName}`,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      displayRequestDuration: true,
    },
  });
};
