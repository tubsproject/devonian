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
  acmeCustomerTable: DevonianTable<AcmeCustomer>;
  acmeLinkedOrderTable: DevonianTable<AcmeLinkedOrder>;

  constructor(index: DevonianIndex, acmeOrderClient: DevonianClient<AcmeOrder>, acmeCustomerClient: DevonianClient<AcmeCustomer>, acmeLinkedOrderClient: DevonianClient<AcmeLinkedOrder>) {
    this.index = index;
    this.acmeOrderTable = new DevonianTable<AcmeOrder>(acmeOrderClient);
    this.acmeCustomerTable = new DevonianTable<AcmeCustomer>(acmeCustomerClient);
    this.acmeLinkedOrderTable = new DevonianTable<AcmeLinkedOrder>(acmeLinkedOrderClient);
    new DevonianLens<AcmeOrder, AcmeLinkedOrder>(
      this.acmeOrderTable,
      this.acmeLinkedOrderTable,
      async (input: AcmeOrder): Promise<AcmeLinkedOrder> => {
        const customerId = await this.acmeCustomerTable.findWhere('id', {
          name: input.customerName,
          address: input.customerAddress,
        }, true);
        console.log("Found customerId", customerId, input.customerName, input.customerAddress);
        const linkedId = this.index.convert('order', 'comprehensive', input.id.toString(), 'linked');
        const ret = {
          id: (typeof linkedId === 'string' ? parseInt(linkedId) : undefined),
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerId: parseInt(customerId),
          foreignIds: this.index.convertForeignIds('comprehensive', input.id.toString(), input.foreignIds, 'linked'),
        };
        console.log('converting from comprehensive to linked', input, ret);
        return ret;
      },
      async (input: AcmeLinkedOrder): Promise<AcmeOrder> => {
        const comprehensiveId = this.index.convert('order', 'linked', input.id.toString(), 'comprehensive');
        const customer = this.acmeCustomerTable.rows[input.customerId];
        const ret = {
          id: (typeof comprehensiveId === 'string' ? parseInt(comprehensiveId) : undefined),
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerName: customer.name,
          customerAddress: customer.address,
          foreignIds: this.index.convertForeignIds('linked', input.id.toString(), input.foreignIds, 'linked'),
        };
        console.log('converting from linked to comprehensive', input, ret);
        return ret;
      },
    );
  }
}
