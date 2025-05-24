import { describe, it, expect } from 'vitest';
import { DevonianModel } from '../../src/DevonianModel.js';
import { DevonianTable } from '../../src/DevonianTable.js';
import { MockClient } from '../helpers.js';

type FooWithoutId = DevonianModel & {
  bar: string;
};

type Foo = FooWithoutId & {
  id: number;
};

describe('DevonianTable', () => {
  it('can store rows', async () => {
    // FIXME why is there name in the client that's different from the table platform?
    const fooClient = new MockClient<FooWithoutId, Foo>('foo');
    const table = new DevonianTable<FooWithoutId, Foo>({ client: fooClient, platform: 'foo', idFieldName: 'id', replicaId: 'inside-unit-tests' });
    const input: FooWithoutId = {
      bar: 'yep',
      foreignIds: {
        'zoo': '5',
      },
    };
    table.addFromLens(input);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect (fooClient.added).toEqual([{
      "bar": "yep",
      "foreignIds": {
        "devonian-inside-unit-tests": 0,
        "zoo": "5",
      },
    }]);
    const rows = await table.getRows();
    // console.log('ROWS', rows);
    expect(JSON.stringify(rows, null, 2)).toEqual(JSON.stringify([{
      "bar": "yep",
      "foreignIds": {
        "zoo": "5",
        "devonian-inside-unit-tests": 0,
        "foo": 0,
      },
    }], null, 2));
    // console.log('FINAL CHECK');
    expect(await table.getPlatformId(input)).toEqual(0);
  });
});
