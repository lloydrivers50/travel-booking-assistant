import { Module } from '@nestjs/common';

import { IngestionService } from './ingestion.service';
import { DOCUMENT_SOURCE } from './document-source';
import { LocalFileDocumentSource } from './local-file.document-source';

@Module({
  providers: [
    IngestionService,
    {
      provide: DOCUMENT_SOURCE,
      useClass: LocalFileDocumentSource,
    },
  ],
})
export class IngestionModule {}
