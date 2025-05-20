import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianTable } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex, ForeignIds } from '../src/DevonianIndex.js';

// this refers to section 2.2 of https://arxiv.org/pdf/2309.11406
export type AcmeOrder = {
  id: number;
  item: string;
  quantity: number;
  shipDate: Date;
  customerName: string;
  customerAddress: string;
  foreignIds: ForeignIds;
}

export type AcmeCustomer = {
  id: number;
  name: string;
  address: string;
}

export type AcmeLinkedOrder = {
  id: number;
  item: string;
  quantity: number;
  shipDate: Date;
  customerId: number;
  foreignIds: ForeignIds;
}

export class ExtractEntityBridge {
  index: DevonianIndex
  acmeOrderTable: DevonianTable<AcmeOrder>;
  acmeLinkedOrderTable: DevonianTable<AcmeLinkedOrder>;

  constructor(index: DevonianIndex, acmeOrderClient: DevonianClient<AcmeOrder>, acmeLinkedOrderClient: DevonianClient<AcmeLinkedOrder>) {
    this.index = index;
    this.acmeOrderTable = new DevonianTable<AcmeOrder>(acmeOrderClient);
    this.acmeLinkedOrderTable = new DevonianTable<AcmeLinkedOrder>(acmeLinkedOrderClient);
    new DevonianLens<AcmeOrder, AcmeLinkedOrder>(
      this.acmeOrderTable,
      this.acmeLinkedOrderTable,
      (input: AcmeOrder): AcmeLinkedOrder => {
        const ret = {
          id: parseInt(this.index.convert('order', 'unlinked', input.id.toString(), 'linked')),
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerId: 0, // how do we handle this lookup?
          // foreignIds: this.index.convertForeignIds('order', 'unlinked', input.id.toString(), input.foreignIds, 'linked'),
          foreignIds: this.index.convertForeignIds('unlinked', input.id.toString(), input.foreignIds, 'linked'),
        };
        // console.log('converting from Solid to Slack', input, ret);
        return ret;
      },
      (input: AcmeLinkedOrder): AcmeOrder => {
        const ret = {
          id: parseInt(this.index.convert('order', 'unlinked', input.id.toString(), 'linked')),
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerName: 'a', // how do we handle this lookup?
          customerAddress: 'b', // how do we handle this lookup?
          // foreignIds: this.index.convertForeignIds('order', 'unlinked', input.id.toString(), input.foreignIds, 'linked'),
          foreignIds: this.index.convertForeignIds('linked', input.id.toString(), input.foreignIds, 'linked'),
        };
        // console.log('converting from Slack to Solid', input, ret);
        return ret;
      },
    );
  }
}
