import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

import { DocumentSource } from './document-source';

@Injectable()
export class LocalFileDocumentSource implements DocumentSource {
  constructor(private configService: ConfigService) {}

  async getBytes(): Promise<Buffer> {
    const path = this.configService.get<string>('POLICY_SAMPLE_PATH');

    if (!path) {
      throw new Error('POLICY_SAMPLE_PATH is not set');
    }

    return readFile(path);
  }
}
