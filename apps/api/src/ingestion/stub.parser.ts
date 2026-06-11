import { Parser, Element } from './parser';

// Hand-transcribed from the real sample policy
// (docs/sample-policies/icb58-travel-expenses-2024.pdf, Appendix 3, page 17).
// This is the test fixture the whole downstream pipeline runs against — it must
// look like what Azure Document Intelligence will eventually produce. confidence:1
// because a hand-written stub is certain by definition; real confidence lands in TBA-4.
const mock: Element[] = [
  {
    type: 'heading',
    page: 17,
    text: 'Appendix 3  Mileage Rates of Reimbursement',
  },
  {
    type: 'paragraph',
    page: 17,
    text: 'At the time of publication, the following rates are applicable.',
  },
  {
    type: 'table',
    page: 17,
    cells: [
      [
        'Type of vehicle/allowance',
        'Annual mileage up to 3,500 miles (standard rate)',
        'Annual mileage over 3,500 miles (standard rate)',
        'All eligible miles travelled',
      ],
      ['Car (all types of fuel)', '59 pence per mile', '24 pence per mile', ''],
      ['Motor cycle', '', '', '30 pence per mile'],
      ['Pedal cycle', '', '', '20 pence per mile'],
      ['Passenger allowance', '', '', '5 pence per mile'],
      ['Reserve rate', '', '', '30 pence per mile'],
      ['Carrying heavy or bulky equipment', '', '', '3 pence per mile'],
    ],
    confidence: 1,
  },
  {
    type: 'paragraph',
    page: 17,
    text: 'To check that these rates are still applicable, please check the Agenda for Change terms & conditions handbook.',
  },
];

export class StubParser implements Parser {
  async parse(_bytes: Buffer): Promise<Element[]> {
    return mock;
  }
}
