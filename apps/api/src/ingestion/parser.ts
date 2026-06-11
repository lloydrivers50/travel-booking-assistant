export type Element =
  | { type: 'heading'; page: number; text: string }
  | { type: 'paragraph'; page: number; text: string }
  | { type: 'table'; page: number; cells: string[][]; confidence: number };

export interface Parser {
  parse(bytes: Buffer): Promise<Element[]>;
}

export const PARSER = Symbol('PARSER');
