import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class BodyValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      skipMissingProperties: false,
      exceptionFactory: (errs: [ValidationError]) => {
        return new BadRequestException({
          message: `Validation errors on these keys: ${this.getMessageFromErrs(
            errs,
          )}`,
          code: 'ERR_VALIDATION',
          statusCode: 400,
          messageDetail: this.getPropertyAndContraints(errs),
        });
      },
    });
  }

  getMessageFromErrs(errs: ValidationError[], parent: string = null): string {
    return errs
      .map((e) => {
        const current = parent ? `${parent}.${e.property}` : `${e.property}`;
        if (e.children.length > 0)
          return `${this.getMessageFromErrs(e.children, current)}`;
        else return current;
      })
      .join(', ');
  }

  getPropertyAndContraints(errs: ValidationError[]): unknown[] {
    const details = [];
    errs.forEach((e) => {
      if (e.children.length > 0) {
        this.getPropertyAndContraints(e.children).forEach((e) =>
          details.push(e),
        );
      } else {
        details.push({
          property: e.property,
          contraints: Object.values(e.constraints),
        });
      }
    });
    return details;
  }
}
