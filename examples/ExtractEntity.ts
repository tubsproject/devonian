import { randomBytes } from 'crypto';
import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianTable, DevonianModel } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex  } from '../src/DevonianIndex.js';

// this refers to section 2.2 of https://arxiv.org/pdf/2309.11406
export type AcmeOrder = DevonianModel & {
  item: string;
  quantity: number;
  shipDate: Date;
  customerName: string;
  customerAddress: string;
}

export type AcmeCustomer =  DevonianModel & {
  name: string;
  address: string;
}

export type AcmeLinkedOrder =  DevonianModel & {
  item: string;
  quantity: number;
  shipDate: Date;
  customerId: number;
}

export class ExtractEntityBridge {
  index: DevonianIndex
  acmeOrderTable: DevonianTable<AcmeOrder>;
  acmeCustomerTable: DevonianTable<AcmeCustomer>;
  acmeLinkedOrderTable: DevonianTable<AcmeLinkedOrder>;

  constructor(index: DevonianIndex, acmeOrderClient: DevonianClient<AcmeOrder>, acmeCustomerClient: DevonianClient<AcmeCustomer>, acmeLinkedOrderClient: DevonianClient<AcmeLinkedOrder>, replicaId?: string) {
    if (typeof replicaId === 'undefined') {
      replicaId = randomBytes(8).toString('hex');
    }
    this.index = index;
    this.acmeOrderTable = new DevonianTable<AcmeOrder>(acmeOrderClient, 'comprehensive', replicaId);
    this.acmeCustomerTable = new DevonianTable<AcmeCustomer>(acmeCustomerClient, 'linked', replicaId);
    this.acmeLinkedOrderTable = new DevonianTable<AcmeLinkedOrder>(acmeLinkedOrderClient, 'linked', replicaId);
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
        const customer = this.acmeCustomerTable.rows[input.customerId] as unknown as { name: string, address: string };
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
