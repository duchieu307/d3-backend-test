import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  metadata: Record<string, unknown>;
}
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const metadata = {
          appName: process.env.APP_NAME,
          version: process.env.APP_VERSION,
          timestamp: new Date(),
        };

        return {
          code: HttpStatus.OK,
          data: data,
          metadata: metadata,
        };
      }),
    );
  }
}
