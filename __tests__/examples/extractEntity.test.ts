import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import { DevonianIndex } from '../../src/DevonianIndex.js';
import { AcmeOrder, AcmeLinkedOrder, AcmeCustomer, ExtractEntityBridge } from '../../examples/ExtractEntity.js';

class MockClient<Model> extends EventEmitter {
  added: Model[] = [];
  counter: number = 0;
  async add(obj: Model): Promise<string> {
    // console.log('adding in mock client', obj);
    this.added.push(obj);
    return (this.counter++).toString();
  }
  fakeIncoming(obj: Model): void {
    // console.log('fake incoming in mock client', obj);
    this.emit('add-from-client', obj);
  }
}

// const client1 = new MockClient<AcmeOrder>();
// const client2 = new MockClient<AcmeCustomer>();
// const client3 = new MockClient<AcmeLinkedOrder>();

// const table1 = new DevonianTable<AcmeOrder>(client1);
// const table2 = new DevonianTable<AcmeCustomer>(client2);
// const table3 = new DevonianTable<AcmeLinkedOrder>(client3);

// void table1, table2, table3

describe('DevonianSolidSlackBridge', () => {
  const index = new DevonianIndex();
  const acmeOrderMockClient = new MockClient<AcmeOrder>();
  const acmeCustomerMockClient = new MockClient<AcmeCustomer>();
  const acmeLinkedOrderMockClient = new MockClient<AcmeLinkedOrder>();
  const bridge = new ExtractEntityBridge(index, acmeOrderMockClient, acmeCustomerMockClient, acmeLinkedOrderMockClient);
  // console.log('Solid is left, Slack is right');
  it('can go from comprehensive to linked', async () => {
    acmeOrderMockClient.fakeIncoming({
      id: 0,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: 'Wile E Coyote',
      customerAddress: '123 Desert Station',
      foreignIds: {},
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(acmeCustomerMockClient.added).toEqual([{
      id: undefined,
      name: 'Wile E Coyote',
      address: '123 Desert Station',
    }]);
    expect(acmeLinkedOrderMockClient.added).toEqual([{
      id: undefined,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerId: 0,
      foreignIds: {
        comprehensive: '0',
      },
    }]);
    expect(bridge.acmeOrderTable.rows).toEqual({});
    expect(bridge.acmeCustomerTable.rows).toEqual({});
    expect(bridge.acmeLinkedOrderTable.rows).toEqual({});
    expect(index.ids).toEqual({});
    expect(index.index).toEqual({});
  });

  it('can go from linked to comprehensive', async () => {
    acmeLinkedOrderMockClient.fakeIncoming({
      id: 0,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerId: 0,
      foreignIds: {},
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(acmeOrderMockClient.added).toEqual([{
      id: NaN,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: 'a',
      customerAddress: 'b',
      foreignIds: {
        linked: '0',
      },
    }]);
  });
});