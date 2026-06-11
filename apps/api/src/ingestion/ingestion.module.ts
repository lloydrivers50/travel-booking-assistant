import { Module } from '@nestjs/common';

import { IngestionService } from './ingestion.service';
import { DOCUMENT_SOURCE } from './document-source';
import { LocalFileDocumentSource } from './local-file.document-source';
import { PARSER } from './parser';
import { StubParser } from './stub.parser';

@Module({
  providers: [
    IngestionService,
    {
      provide: DOCUMENT_SOURCE,
      useClass: LocalFileDocumentSource,
    },
    { provide: PARSER, useClass: StubParser },
  ],
})
export class IngestionModule {}
