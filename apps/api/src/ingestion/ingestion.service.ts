import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import type { DocumentSource } from './document-source';
import { DOCUMENT_SOURCE } from './document-source';

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(DOCUMENT_SOURCE)
    private readonly source: DocumentSource,
  ) {}

  async onModuleInit() {
    const bytes = await this.source.getBytes();
    this.logger.log(bytes.byteLength);
  }
}
