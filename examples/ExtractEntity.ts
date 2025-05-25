import { randomBytes } from 'crypto';
import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianModel } from '../src/DevonianModel.js';
import { DevonianTable } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex  } from '../src/DevonianIndex.js';

// this refers to section 2.2 of https://arxiv.org/pdf/2309.11406
export type AcmeOrderWithoutId = DevonianModel & {
  item: string;
  quantity: number;
  shipDate: Date;
  customerName: string;
  customerAddress: string;
}
export type AcmeOrder =  AcmeOrderWithoutId & {
  id: number;

}
export type AcmeCustomerWithoutId =  DevonianModel & {
  name: string;
  address: string;
}
export type AcmeCustomer =  AcmeCustomerWithoutId & {
  id: number;
}

export type AcmeLinkedOrderWithoutId =  DevonianModel & {
  item: string;
  quantity: number;
  shipDate: Date;
  customerId: number;
}
export type AcmeLinkedOrder =  AcmeLinkedOrderWithoutId & {
  id: number;
}

export class ExtractEntityBridge {
  index: DevonianIndex;
  acmeOrderTable: DevonianTable<AcmeOrderWithoutId, AcmeOrder>;
  acmeCustomerTable: DevonianTable<AcmeCustomerWithoutId, AcmeCustomer>;
  acmeLinkedOrderTable: DevonianTable<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>;

  constructor(index: DevonianIndex, acmeOrderClient: DevonianClient<AcmeOrderWithoutId, AcmeOrder>, acmeCustomerClient: DevonianClient<AcmeCustomerWithoutId, AcmeCustomer>, acmeLinkedOrderClient: DevonianClient<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>, replicaId?: string) {
    if (typeof replicaId === 'undefined') {
      replicaId = randomBytes(8).toString('hex');
    }
    this.index = index;
    this.acmeOrderTable = new DevonianTable<AcmeOrderWithoutId, AcmeOrder>({ client: acmeOrderClient, platform: 'comprehensive', idFieldName: 'id', replicaId });
    this.acmeCustomerTable = new DevonianTable<AcmeCustomerWithoutId, AcmeCustomer>({ client: acmeCustomerClient, platform: 'linked', idFieldName: 'id', replicaId });
    this.acmeLinkedOrderTable = new DevonianTable<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>({ client: acmeLinkedOrderClient, platform: 'linked', idFieldName: 'id', replicaId });
    new DevonianLens<AcmeOrderWithoutId, AcmeLinkedOrderWithoutId, AcmeOrder, AcmeLinkedOrder>(
      this.acmeOrderTable,
      this.acmeLinkedOrderTable,
      async (input: AcmeOrder): Promise<AcmeLinkedOrder> => {
        const customerId = await this.acmeCustomerTable.getPlatformId({
          name: input.customerName,
          address: input.customerAddress,
          foreignIds: {},
        }, true);
        if (customerId === 2) {
         console.error('NOOOOOOOOOOOO!');
        }
        const linkedId = this.index.convertId('order', 'comprehensive', input.id.toString(), 'linked');
        const ret = {
          id: linkedId as number,
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerId: customerId as number,
          foreignIds: this.index.convertForeignIds('comprehensive', input.id.toString(), input.foreignIds, 'linked'),
        };
        return ret;
      },
      async (input: AcmeLinkedOrder): Promise<AcmeOrder> => {
        const comprehensiveId = this.index.convertId('order', 'linked', input.id.toString(), 'comprehensive');
        const customer = await this.acmeCustomerTable.getRow(input.customerId);
        const ret = {
          id: comprehensiveId as number,
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerName: customer.name,
          customerAddress: customer.address,
          foreignIds: this.index.convertForeignIds('linked', input.id.toString(), input.foreignIds, 'comprehensive'),
        };
        return ret;
      },
    );
  }
}
