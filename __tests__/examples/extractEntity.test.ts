import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import { DevonianIndex } from '../../src/DevonianIndex.js';
import { AcmeOrder, AcmeLinkedOrder, AcmeCustomer, ExtractEntityBridge } from '../../examples/ExtractEntity.js';

class MockClient<Model> extends EventEmitter {
  added: Model[] = [];
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
  async add(obj: Model): Promise<string> {
    const position = this.added.length;
    console.log(`Adding in ${this.name} mock client`, obj, position);
    this.added.push(obj);
    return position.toString();
  }
  fakeIncoming(obj: Model): void {
    // console.log('fake incoming in mock client', obj);
    this.emit('add-from-client', obj);
  }
}

describe('ExtractEntity', () => {
  const index = new DevonianIndex();
  const acmeOrderMockClient = new MockClient<AcmeOrder>('orders');
  const acmeCustomerMockClient = new MockClient<AcmeCustomer>('customers');
  const acmeLinkedOrderMockClient = new MockClient<AcmeLinkedOrder>('linked orders');
  const bridge = new ExtractEntityBridge(index, acmeOrderMockClient, acmeCustomerMockClient, acmeLinkedOrderMockClient);
  // console.log('Comprehensive is left, Linked is right');
  it('can go from comprehensive to linked', async () => {
    console.log('fakeIncoming Anvil');
    acmeOrderMockClient.fakeIncoming({
      id: 0,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: 'Wile E Coyote',
      customerAddress: '123 Desert Station',
      foreignIds: {},
    });
    console.log('fakeIncoming Dynamite');
    acmeOrderMockClient.fakeIncoming({
      id: 1,
      item: 'Dynamite',
      quantity: 1,
      shipDate: undefined,
      customerName: 'Daffy Duck',
      customerAddress: 'White Rock Lake',
      foreignIds: {},
    });
    console.log('fakeIncoming Bird Seed');
    acmeOrderMockClient.fakeIncoming({
      id: 2,
      item: 'Bird Seed',
      quantity: 1,
      shipDate: undefined,
      customerName: 'Wile E Coyote',
      customerAddress: '123 Desert Station',
      foreignIds: {},
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(acmeCustomerMockClient.added).toEqual([{
      id: undefined,
      name: 'Wile E Coyote',
      address: '123 Desert Station',
    },
    {
      id: undefined,
      name: 'Daffy Duck',
      address: 'White Rock Lake',
    }]);
    expect(acmeLinkedOrderMockClient.added.map(row => JSON.stringify(row)).sort()).toEqual([{
      id: undefined,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerId: 0,
      foreignIds: {
        comprehensive: '0',
      },
    },
    {
      "id": undefined,
      "item": "Dynamite",
      "quantity": 1,
      "shipDate": undefined,
      "customerId": 1,
      "foreignIds": {
        "comprehensive": "1",
      },
    },
    {
      "id": undefined,
      "item": "Bird Seed",
      "quantity": 1,
      "shipDate": undefined,
      "customerId": 0,
      "foreignIds": {
        "comprehensive": "2",
      },
    }].map(row => JSON.stringify(row)).sort());
    expect(bridge.acmeOrderTable.rows.sort()).toEqual([{
      "id": 0,
      "item": "Anvil",
      "quantity": 1,
      "shipDate": new Date('2023-02-03T00:00:00.000Z'),
      "customerName": "Wile E Coyote",
      "customerAddress": "123 Desert Station",
      "foreignIds": {},
    },
    {
      "id": 1,
      "item": "Dynamite",
      "quantity": 1,
      "shipDate": undefined,
      "customerName": "Daffy Duck",
      "customerAddress": "White Rock Lake",
      "foreignIds": {},
    },
    {
      "id": 2,
      "item": "Bird Seed",
      "quantity": 1,
      "shipDate": undefined,
      "customerName": "Wile E Coyote",
      "customerAddress": "123 Desert Station",
      "foreignIds": {},
    }].sort());
    await Promise.all(bridge.acmeCustomerTable.rows.map(async row => { row.id = await row.id; }));
    expect(bridge.acmeCustomerTable.rows.sort()).toEqual([
      {
        "id": "0",
        "name": "Wile E Coyote",
        "address": "123 Desert Station",
      },
      {
        "id": "1",
        "name": "Daffy Duck",
        "address": "White Rock Lake",
      },
    ].sort());
    await Promise.all(bridge.acmeLinkedOrderTable.rows.map(async row => { row.id = await row.id; }));
    expect(bridge.acmeLinkedOrderTable.rows.sort()).to.deep.equal([{
      "id": "0",
      "item": "Bird Seed",
      "quantity": 1,
      "customerId": 0,
      "foreignIds": {
        "comprehensive": "2",
      },
    },
    {
      "id": "1",
      "item": "Anvil",
      "quantity": 1,
      "shipDate": '2023-02-03T00:00:00.000Z',
      "customerId": 0,
      "foreignIds": {
        "comprehensive": "0",
      },
    },
    {
      "id": "2",
      "item": "Dynamite",
      "quantity": 1,
      "customerId": 1,
      "foreignIds": {
        "comprehensive": "1",
      },
    }].sort());
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
      id: undefined,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: 'Wile E Coyote',
      customerAddress: '123 Desert Station',
      foreignIds: {
        linked: '0',
      },
    }]);
  });
});