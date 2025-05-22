import { DevonianTable, DevonianModel } from './DevonianTable.js';

export class DevonianLens<LeftModel extends DevonianModel, RightModel extends DevonianModel> {
  left: DevonianTable<LeftModel>;
  right: DevonianTable<RightModel>;
  constructor(
    left: DevonianTable<LeftModel>,
    right: DevonianTable<RightModel>,
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
