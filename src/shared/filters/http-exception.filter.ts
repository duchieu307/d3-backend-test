import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  async catch(exception: HttpException, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const { code, message, ...rest }: any = exception.getResponse();

    const isCommonBotPath = this.isCommonBotPath(request.url);
    if (status === HttpStatus.NOT_FOUND && isCommonBotPath) {
      response.status(404).end();
      return;
    }

    this.logger.error(exception);
    this.logger.error(exception.stack);

    response.status(status).json({
      code: code || 'ERROR_00000',
      statusCode: status || HttpStatus.INTERNAL_SERVER_ERROR,
      info: {
        message: message || 'Unknown errors',
        ...rest,
      },
      path: request.url,
    });
  }

  private isCommonBotPath(url: string): boolean {
    const botPaths = [
      '/login.jsp',
      '/admin',
      '/wp-admin',
      '/wp-login.php',
      '/phpmyadmin',
      '/mysql',
      '/console',
      '/manager',
      '/solr',
      '/jenkins',
      '/actuator',
      '/.env',
      '/robots.txt',
      '/sitemap.xml',
      '/favicon.ico',
      '/.well-known',
      '/index.php',
      '/config.php',
      '/.git',
      '/database',
      '/backup',
    ];

    return botPaths.some((path) => url.startsWith(path));
  }
}
