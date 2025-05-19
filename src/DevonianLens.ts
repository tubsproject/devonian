import { DevonianTable } from './DevonianTable.js';

export class DevonianLens<LeftModel, RightModel> {
  left: DevonianTable<LeftModel>;
  right: DevonianTable<RightModel>;
  constructor(
    left: DevonianTable<LeftModel>,
    right: DevonianTable<RightModel>,
    leftToRight: (input: LeftModel) => RightModel,
    rightToLeft: (input: RightModel) => LeftModel,
  ) {
    this.left = left;
    this.right = right;
    left.on('add-from-client', (added: LeftModel) => {
      // console.log('lens forwards addition event from left to right');
      right.addFromLens(leftToRight(added));
    });
    right.on('add-from-client', (added: RightModel) => {
      // console.log('lens forwards addition event from right to left');
      left.addFromLens(rightToLeft(added));
    });
  }
}
