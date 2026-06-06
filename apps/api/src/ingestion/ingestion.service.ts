import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const filePath = join(
  process.cwd(),
  '..',
  '..',
  'docs',
  'sample-policies',
  'nhs-expenses.pdf',
);

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  async onModuleInit() {
    await this.ingest();
  }

  private async ingest() {
    const data = await readFile(filePath);
    this.logger.log(data.byteLength);
  }
}
