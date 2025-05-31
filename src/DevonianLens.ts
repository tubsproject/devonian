import { DevonianTable } from './DevonianTable.js';
import { DevonianModel } from './DevonianModel.js';

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
      right.ensureRow(await leftToRight(added));
    });
    right.on('add-from-client', async (added: RightModel) => {
      // console.log('lens forwards addition event from right to left');
      left.ensureRow(await rightToLeft(added));
    });
  }
}
