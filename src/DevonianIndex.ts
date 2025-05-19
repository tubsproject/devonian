export type ForeignIds = {
  [platform: string]: string
};

export class DevonianIndex {
  ids: {
   [model: string]: {
     [platform: string]: string
   }[]
  } = {};
  index: {
    [model: string]: {
      [platform: string]: {
        [localId: string]: number;
      };
    };
  } = {};

  lookupIndexFrom(model: string, platform: string, localId: string, foreignIds: { [platform: string]: string}): number | undefined {
    if (typeof this.index[model]?.[platform]?.[localId] === 'number') {
      return this.index[model]![platform]![localId];
    }
    for (let i = 0; i < Object.keys(foreignIds).length; i++) {
      const otherPlatform = Object.keys(foreignIds)[i];
      if (typeof this.index[model]?.[otherPlatform]?.[foreignIds[otherPlatform]] === 'number') {
        return this.index[model]![otherPlatform]![foreignIds[otherPlatform]];
      }
    }
    return undefined;
  }
  
  storeIdentitiesFrom(model: string, platform: string, localId: string, foreignIds: { [platform: string]: string}) {
    const i = this.lookupIndexFrom(model, platform, localId, foreignIds);
    if (typeof i === 'number') {
      this.ids[model][i][platform] = localId;
      this.index[model]![platform]![localId] = i;
      Object.keys(foreignIds).forEach(otherPlatform => {
        this.ids[model][i][otherPlatform] = foreignIds[otherPlatform];
        this.index[model]![otherPlatform]![foreignIds[otherPlatform]] = i;
      });
    }
  }

  convert(model: string, fromPlatform: string, fromLocalId: string, toPlatform: string): string | undefined {
    const i: number | undefined = this.index[model]?.[fromPlatform]?.[fromLocalId];
    if (i) {
      return this.ids[model][i][toPlatform];
    }
    return undefined;
  }
  convertForeignIds(fromPlatform: string, fromId: string, fromForeignIds: ForeignIds, toPlatform: string) {
    const copied = JSON.parse(JSON.stringify(fromForeignIds));
    delete copied[toPlatform];
    copied[fromPlatform] = fromId;
    return copied;
  }
}
