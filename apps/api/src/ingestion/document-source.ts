export interface DocumentSource {
  getBytes(): Promise<Buffer>;
}

export const DOCUMENT_SOURCE = Symbol('DOCUMENT_SOURCE');
