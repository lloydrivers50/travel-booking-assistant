import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import type { DocumentSource } from './document-source';
import { DOCUMENT_SOURCE } from './document-source';
import { PARSER } from './parser';
import type { Parser } from './parser';

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(DOCUMENT_SOURCE)
    private readonly source: DocumentSource,
    @Inject(PARSER)
    private readonly parser: Parser,
  ) {}

  async onModuleInit() {
    const bytes = await this.source.getBytes();
    const elements = await this.parser.parse(bytes);
    // Target log: parsed 4 elements: 1 heading, 2 paragraphs, 1 table (1 page)
    const elementCounts = elements.reduce((counts, element) => {
      counts[element.type] = (counts[element.type] || 0) + 1;
      return counts;
    }, {});
    this.logger.log(
      `Parsed ${Object.keys(elements).length} elements:`,
      JSON.stringify(elementCounts, null, 2),
    );
  }
}
