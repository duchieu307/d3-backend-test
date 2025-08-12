// console.ts - example of entrypoint
import { Logger } from '@nestjs/common';
import { BootstrapConsole } from 'nestjs-console';
import { AppModule } from 'src/app.module';

const logger = new Logger('ConsoleLogger');

const bootstrap = new BootstrapConsole({
  module: AppModule,
  useDecorators: true,
  contextOptions: {
    logger: logger,
  },
});
bootstrap.init().then(async (app) => {
  try {
    await app.init();
    await bootstrap.boot();
    await app.close();
  } catch (e) {
    console.error(e);
    await app.close();
    process.exit(1);
  }
});
