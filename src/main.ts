import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { applySwagger } from 'src/configs/swagger';
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter';
import { ResponseTransformInterceptor } from 'src/shared/interceptors/response.interceptor';
import { BodyValidationPipe } from 'src/shared/pipes/body-validation.pipe';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appPort = process.env.APP_PORT;
  const appName = process.env.APP_NAME;
  const appVersion = process.env.APP_VERSION;

  app.setGlobalPrefix(`api/${appVersion}`);

  app.enableCors();
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalPipes(new BodyValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  applySwagger(app);

  await app.listen(appPort, () => {
    console.log(
      `${appName}-${appVersion} - http://0.0.0.0:${appPort}/api/${appVersion}/swagger`,
    );
  });
}

void bootstrap();
