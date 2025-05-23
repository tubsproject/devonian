import { MockClient } from '../MockClient.js';
import { describe, it, expect } from 'vitest';
import { DevonianIndex } from '../../src/DevonianIndex.js';
import { AcmeOrderWithoutId, AcmeLinkedOrderWithoutId, AcmeCustomerWithoutId, AcmeOrder, AcmeLinkedOrder, AcmeCustomer, ExtractEntityBridge } from '../../examples/ExtractEntity.js';

describe('ExtractEntity', () => {
  const replicaId = `devonian-test-instance`;
  const index = new DevonianIndex();
  const acmeOrderMockClient = new MockClient<AcmeOrderWithoutId, AcmeOrder>('orders');
  const acmeCustomerMockClient = new MockClient<AcmeCustomerWithoutId, AcmeCustomer>('customers');
  const acmeLinkedOrderMockClient = new MockClient<AcmeLinkedOrderWithoutId, AcmeLinkedOrder>('linked orders');
  const bridge = new ExtractEntityBridge(index, acmeOrderMockClient, acmeCustomerMockClient, acmeLinkedOrderMockClient, replicaId);
  // console.log('Comprehensive is left, Linked is right');
  it('can go from comprehensive to linked', async () => {
    // console.log('fakeIncoming Anvil');
    acmeOrderMockClient.fakeIncoming({
      id: 0,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: 'Wile E Coyote',
      customerAddress: '123 Desert Station',
      foreignIds: {},
    });
    // console.log('fakeIncoming Dynamite');
    acmeOrderMockClient.fakeIncoming({
      id: 1,
      item: 'Dynamite',
      quantity: 1,
      shipDate: undefined,
      customerName: 'Daffy Duck',
      customerAddress: 'White Rock Lake',
      foreignIds: {},
    });
    // console.log('fakeIncoming Bird Seed');
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
    // expect(acmeCustomerMockClient.added).toEqual([{
    //   id: undefined,
    //   name: 'Wile E Coyote',
    //   address: '123 Desert Station',
    // },
    // {
    //   id: undefined,
    //   name: 'Daffy Duck',
    //   address: 'White Rock Lake',
    // }]);
    expect(acmeLinkedOrderMockClient.added).toEqual([{
      id: undefined,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerId: 0,
      foreignIds: {
        comprehensive: '0',
        "devonian-devonian-test-instance": 0,
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
        "devonian-devonian-test-instance": 1,
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
        "devonian-devonian-test-instance": 2,
      },
    }]);
    expect(await bridge.acmeOrderTable.getRows()).toEqual([{
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
    }]);
    expect(await bridge.acmeCustomerTable.getRows()).toEqual([
      {
        "name": "Wile E Coyote",
        "address": "123 Desert Station",
        "foreignIds": {
          "devonian-devonian-test-instance": 0,
          "linked": 0,
        },
      },
      {
        "name": "Daffy Duck",
        "address": "White Rock Lake",
        "foreignIds": {
          "devonian-devonian-test-instance": 1,
          "linked": 1,
        },
      },
    ]);
    expect(await bridge.acmeLinkedOrderTable.getRows()).toEqual([{
      "item": "Anvil",
      "quantity": 1,
      "shipDate": '2023-02-03T00:00:00.000Z',
      "customerId": 0,
      "foreignIds": {
        "comprehensive": "0",
        "devonian-devonian-test-instance": 0,
        "linked": 0,
      },
    },
    {
      "item": "Dynamite",
      "quantity": 1,
      "shipDate": undefined,
      "customerId": 1,
      "foreignIds": {
        "comprehensive": "1",
        "devonian-devonian-test-instance": 1,
        "linked": 1,
      },
    },
    {
      "item": "Bird Seed",
      "quantity": 1,
      "shipDate": undefined,
      "customerId": 0,
      "foreignIds": {
        "comprehensive": "2",
        "devonian-devonian-test-instance": 2,
        "linked": 2,
      },
    }]);
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
        "devonian-devonian-test-instance": 3,
      },
    }]);
  });
}); 