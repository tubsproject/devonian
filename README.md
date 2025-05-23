# Bidirectional Lenses for Data Portability
## Work in Progress
[API docs](https://tubsproject.github.io/devonian/)

[![A Tiktaalik leaving its pond in search for another one](https://cdn.mos.cms.futurecdn.net/fi8nrWxvEb5sowf5jkQ8RY-700-80.jpg.webp)](https://www.livescience.com/43596-devonian-period.html)

Inspired by [the Cambria Project](https://github.com/inkandswitch/cambria-project), Devonian drops the DSL approach and adds a focus on mapping between not just differences in schema, but also differences in primary key assignment between two Systems of Record.

*Identifier Maps are the Vector Clocks of Data Portability.*

## How it works
The core is in DevonianLens which is very simple: it links corresponding database tables on different systems of record (e.g. bridging a Slack channel with a Matrix room, copying over messages from one to the other), and calls a 'left to right' translation function when a change happens on the left, then add the result on the right. So far only additions have been implemented; updates and deletions coming soon:
```ts
export class DevonianLens<
  LeftModelWithoutId extends DevonianModel,
  RightModelWithoutId extends DevonianModel,
  LeftModel extends LeftModelWithoutId,
  RightModel extends RightModelWithoutId,
> {
  left: DevonianTable<LeftModelWithoutId, LeftModel>;
  right: DevonianTable<RightModelWithoutId, RightModel>;
  constructor(
    left: DevonianTable<LeftModelWithoutId, LeftModel>,
    right: DevonianTable<RightModelWithoutId, RightModel>,
    leftToRight: (input: LeftModel) => Promise<RightModel>,
    rightToLeft: (input: RightModel) => Promise<LeftModel>,
  ) {
    this.left = left;
    this.right = right;
    left.on('add-from-client', async (added: LeftModel) => {
      // console.log('lens forwards addition event from left to right');
      right.addFromLens(await leftToRight(added));
    });
    right.on('add-from-client', async (added: RightModel) => {
      // console.log('lens forwards addition event from right to left');
      left.addFromLens(await rightToLeft(added));
    });
  }
}
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