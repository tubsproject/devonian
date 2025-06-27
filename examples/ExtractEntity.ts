import { randomBytes } from 'crypto';
import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianModel } from '../src/DevonianModel.js';
import { DevonianTable } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex  } from '../src/DevonianIndex.js';

// this refers to section 2.2 of https://arxiv.org/pdf/2309.11406
export type AcmeComprehensiveOrderWithoutId = DevonianModel & {
  item: string;
  quantity: number;
  shipDate: Date | undefined;
  customerName: string;
  customerAddress: string;
}
export type AcmeComprehensiveOrder =  AcmeComprehensiveOrderWithoutId & {
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
  shipDate: Date | undefined;
  customerId: number;
}
export type AcmeLinkedOrder =  AcmeLinkedOrderWithoutId & {
  id: number;
}

export class ExtractEntityBridge {
  index: DevonianIndex;
  acmeComprehensiveOrderTable: DevonianTable<AcmeComprehensiveOrderWithoutId, AcmeComprehensiveOrder>;
  acmeCustomerTable: DevonianTable<AcmeCustomerWithoutId, AcmeCustomer>;
  acmeLinkedOrderTable: DevonianTable<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>;

  constructor(index: DevonianIndex, acmeOrderClient: DevonianClient<AcmeComprehensiveOrderWithoutId, AcmeComprehensiveOrder>, acmeCustomerClient: DevonianClient<AcmeCustomerWithoutId, AcmeCustomer>, acmeLinkedOrderClient: DevonianClient<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>, replicaId?: string) {
    if (typeof replicaId === 'undefined') {
      replicaId = randomBytes(8).toString('hex');
    }
    this.index = index;
    this.acmeComprehensiveOrderTable = new DevonianTable<AcmeComprehensiveOrderWithoutId, AcmeComprehensiveOrder>({ client: acmeOrderClient, platform: 'comprehensive', idFieldName: 'id', replicaId });
    this.acmeCustomerTable = new DevonianTable<AcmeCustomerWithoutId, AcmeCustomer>({ client: acmeCustomerClient, platform: 'linked', idFieldName: 'id', replicaId });
    this.acmeLinkedOrderTable = new DevonianTable<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>({ client: acmeLinkedOrderClient, platform: 'linked', idFieldName: 'id', replicaId });
    new DevonianLens<AcmeComprehensiveOrderWithoutId, AcmeLinkedOrderWithoutId, AcmeComprehensiveOrder, AcmeLinkedOrder>(
      this.acmeComprehensiveOrderTable,
      this.acmeLinkedOrderTable,
      async (input: AcmeComprehensiveOrder): Promise<AcmeLinkedOrder> => {
        const customerId = await this.acmeCustomerTable.getPlatformId({
          name: input.customerName,
          address: input.customerAddress,
          foreignIds: {},
        }, true);
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
      async (input: AcmeLinkedOrder): Promise<AcmeComprehensiveOrder> => {
        const comprehensiveId = this.index.convertId('order', 'linked', input.id.toString(), 'comprehensive');
        const customer = await this.acmeCustomerTable.getRow(input.customerId);
        const ret = {
          id: comprehensiveId as number,
          item: input.item,
          quantity: input.quantity,
          shipDate: input.shipDate,
          customerName: (customer ? customer.name : ''),
          customerAddress: (customer ? customer.address : ''),
          foreignIds: this.index.convertForeignIds('linked', input.id.toString(), input.foreignIds, 'comprehensive'),
        };
        return ret;
      },
    );
  }
}
