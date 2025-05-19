import { DevonianClient } from './DevonianLens.js';
import { DevonianIndex, ForeignIds } from './DevonianIndex.js';


export function solidSameasToForeignIds(sameAs: string[]): { [platform: string]: string } {
  const ret: { [platform: string]: string } = {};
  sameAs.forEach((uri: string) => {
    if (uri.startsWith(`https://tubsproject.org/id/message/`)) {
      const rest = (uri.substring(`https://tubsproject.org/id/message/`.length));
      const parts = rest.split('/');
      if (parts.length === 2) {
        ret[parts[0]] = parts[1]
      }
    }
  });
  return ret;
}

export function foreignIdsToSolidSameas(foreignIds: object): string[] {
  return Object.keys(foreignIds).map(otherPlatform => {
    return `https://tubsproject.org/id/message/${otherPlatform}/${foreignIds[otherPlatform]}`;
  });
}


export type SolidMessage = {
  uri?: string,
  chatUri: string,
  text: string,
  authorWebId: string,
  date?: Date,
  foreignIds: ForeignIds,
};

export class SolidMessageClient extends DevonianClient<SolidMessage> {
  private index: DevonianIndex;
  constructor(index: DevonianIndex) {
    super();
    this.index = index;
    this.on('add', (obj: SolidMessage) => {
      console.log('incoming solid message');
      this.storeIdentitiesFromSolid(obj);
    });
  }

  private storeIdentitiesFromSolid(input: SolidMessage) {
    this.index.storeIdentitiesFrom('message', 'solid', input.uri, input.foreignIds);
  }

  async add(obj: SolidMessage) {
    console.log('make an API call', obj);
    return 'uri';
  }
}