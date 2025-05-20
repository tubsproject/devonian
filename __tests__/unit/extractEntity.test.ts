import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import { DevonianTable } from '../../src/DevonianTable.js';
import { DevonianIndex } from '../../src/DevonianIndex.js';
import { AcmeOrder, AcmeCustomer, AcmeLinkedOrder, ExtractEntityBridge } from '../../examples/ExtractEntity.js';

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

const client1 = new MockClient<AcmeOrder>();
const client2 = new MockClient<AcmeCustomer>();
const client3 = new MockClient<AcmeLinkedOrder>();

const table1 = new DevonianTable<AcmeOrder>(client1);
const table2 = new DevonianTable<AcmeCustomer>(client2);
const table3 = new DevonianTable<AcmeLinkedOrder>(client3);

void table1, table2, table3

describe('DevonianSolidSlackBridge', () => {
  const index = new DevonianIndex();
  const acmeOrderMockClient = new MockClient<AcmeOrder>();
  const acmeLinkedOrderMockClient = new MockClient<AcmeLinkedOrder>();
  new ExtractEntityBridge(index, acmeOrderMockClient, acmeLinkedOrderMockClient);
  // console.log('Solid is left, Slack is right');
  it('can go from unlinked to linked', async () => {
    acmeOrderMockClient.fakeIncoming({
      id: 0,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerName: '',
      customerAddress: '',
      foreignIds: {},
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(acmeLinkedOrderMockClient.added).toEqual([{
      id: NaN,
      item: 'Anvil',
      quantity: 1,
      shipDate: new Date('2023-02-03T00:00:00Z'),
      customerId: 0,
      foreignIds: {
        unlinked: '0',
      },
    }]);
  });

  it('can go from linked to unlinked', async () => {
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