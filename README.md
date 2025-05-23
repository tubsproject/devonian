# Bidirectional Lenses for Data Portability
## Work in Progress
[API docs](https://tubsproject.github.io/devonian/)

[![A Tiktaalik leaving its pond in search for another one](https://cdn.mos.cms.futurecdn.net/fi8nrWxvEb5sowf5jkQ8RY-700-80.jpg.webp)](https://www.livescience.com/43596-devonian-period.html)

Inspired by [the Cambria Project](https://github.com/inkandswitch/cambria-project), Devonian drops the DSL approach and adds a focus on mapping between not just differences in schema, but also differences in primary key assignment between two Systems of Record.

*Identifier Maps are the Vector Clocks of Data Portability.*

## How it works
The core is in DevonianLens which is very simple: it links corresponding database tables on different systems of record (e.g. bridging a Slack channel with a Matrix room, copying over messages from one to the other), and calls a 'left to right' translation function when a change happens on the left, then add the result on the right. So far only additions have been implemented; updates and deletions coming soon. Here is an implementation of the ['Extract Entity' challenge](https://arxiv.org/pdf/2309.11406):
```ts
new DevonianLens<
  AcmeOrderWithoutId,
  AcmeLinkedOrderWithoutId,
  AcmeOrder,
  AcmeLinkedOrde
>(
  this.acmeOrderTable,
  this.acmeLinkedOrderTable,
  async (input: AcmeOrder): Promise<AcmeLinkedOrder> => {
    const customerId = await this.acmeCustomerTable.getPlatformId({
      name: input.customerName,
      address: input.customerAddress,
      foreignIds: {},
    }, true);
    const linkedId = this.index.convertId(
      'order',
      'comprehensive',
      input.id.toString(),
      'linked'
    );
    const ret = {
      id: linkedId as number,
      item: input.item,
      quantity: input.quantity,
      shipDate: input.shipDate,
      customerId: customerId as number,
      foreignIds: this.index.convertForeignIds(
        'comprehensive',
        input.id.toString(),
        input.foreignIds,
        'linked'
      ),
    };
    return ret;
  },
  async (input: AcmeLinkedOrder): Promise<AcmeOrder> => {
    const comprehensiveId = this.index.convertId(
      'order',
      'linked',
      input.id.toString(),
      'comprehensive'
    );
    const customer = await this.acmeCustomerTable.getRow(input.customerId);
    const ret = {
      id: comprehensiveId as number,
      item: input.item,
      quantity: input.quantity,
      shipDate: input.shipDate,
      customerName: customer.name,
      customerAddress: customer.address,
      foreignIds: this.index.convertForeignIds(
        'linked',
        input.id.toString(),
        input.foreignIds,
        'comprehensive'
      ),
    };
    return ret;
  },
);
```

Apart from the translation of differently named JSON fields, when copying a message from Slack to Matrix, it will be assigned a newly minted primary key on Matrix, and the bridge needs to keep track of which Slack message ID corresponds to which Matrix message ID.
The `DevonianIndex` class keeps track of different identifiers an object may have on different platforms, and generates a `ForeignIds` object for each platform. If a platform API offers a place for storing custom metadata, the `ForeignIds` object can be stored there.

## Link with Automerge
We'll also be adding a way to combine Devonian with [Automerge](https://automerge.org) so that conflicting changes can be handled more gracefully.
In a [previous version](https://github.com/tubsproject/reflector/blob/e01470d/README.md), the translation would happen in two steps (left -> middle -> right) and the middle format was stored on Automerge. We have to work out where to put Automerge back in, now that that middle representation is gone.

## Usage
See the [example Solid-Slack bridge](https://github.com/tubsproject/devonian/blob/main/examples/DevonianSolidSlackBridge.ts).

## Contributing
Please [create an issue](https://github.com/tubsproject/devonian/issues/new) with any feedback you might have.
```sh
pnpm install
pnpm test
```