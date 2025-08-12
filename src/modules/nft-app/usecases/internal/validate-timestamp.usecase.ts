import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ValidateTimestampUseCase {
  private readonly MINIMUM_TIMESTAMP = 1609459200000; // January 1, 2021

  async execute(timestamp: number): Promise<void> {
    this.validateTimestampFormat(timestamp);
    this.validateTimestampRange(timestamp);
  }

  private validateTimestampFormat(timestamp: number): void {
    // Check if timestamp is a valid number
    if (!Number.isInteger(timestamp) || timestamp <= 0) {
      throw new HttpException(
        {
          message: 'Timestamp must be a positive integer',
          error: 'Invalid Timestamp Format',
          details: {
            provided: timestamp,
            expectedType: 'positive integer',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateTimestampRange(timestamp: number): void {
    const currentTimestamp = Date.now();

    // Check if timestamp is in the future
    if (timestamp > currentTimestamp) {
      throw new HttpException(
        {
          message: 'Timestamp cannot be in the future',
          error: 'Future Timestamp',
          details: {
            provided: timestamp,
            current: currentTimestamp,
            providedDate: new Date(timestamp).toISOString(),
            currentDate: new Date(currentTimestamp).toISOString(),
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if timestamp is reasonable (not too far in the past)
    if (timestamp < this.MINIMUM_TIMESTAMP) {
      throw new HttpException(
        {
          message: 'Timestamp is too far in the past',
          error: 'Historical Timestamp',
          details: {
            provided: timestamp,
            minimum: this.MINIMUM_TIMESTAMP,
            providedDate: new Date(timestamp).toISOString(),
            minimumDate: new Date(this.MINIMUM_TIMESTAMP).toISOString(),
            reason: 'NFT data not available before January 1, 2021',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
