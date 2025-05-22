export type IdentifierMap = {
  [platform: string]: string | number;
};

export type Equivalences = {
  [model: string]: IdentifierMap[];
};

export class DevonianIndex {
  ids: {
    [model: string]: IdentifierMap[];
  } = {};
  index: {
    [model: string]: {
      [platform: string]: IdentifierMap;
    };
  } = {};

  lookupIndexFrom(
    model: string,
    platform: string,
    localId: string | number,
    foreignIds: { [platform: string]: string },
  ): number | string | undefined {
    if (typeof this.index[model]?.[platform]?.[localId] === 'number') {
      return this.index[model]![platform]![localId];
    }
    for (let i = 0; i < Object.keys(foreignIds).length; i++) {
      const otherPlatform = Object.keys(foreignIds)[i];
      if (
        typeof this.index[model]?.[otherPlatform]?.[
          foreignIds[otherPlatform]
        ] === 'number'
      ) {
        return this.index[model]![otherPlatform]![foreignIds[otherPlatform]];
      }
    }
    return undefined;
  }

  ensureIndexed(model: string, i: number): void {
    if (typeof this.index[model] === 'undefined') {
      this.index[model] = {};
    }
    Object.keys(this.ids[model][i]).forEach((platform: string) => {
      if (typeof this.index[model][platform] === 'undefined') {
        this.index[model][platform] = {};
      }
      this.index[model][platform][this.ids[model][i][platform]] = i;
    });
  }

  storeIdentitiesFrom(
    model: string,
    platform: string,
    localId: string | number,
    foreignIds: { [platform: string]: string },
  ): void {
    let i = this.lookupIndexFrom(model, platform, localId, foreignIds);
    // console.log('storing', model, platform, localId, foreignIds, i);
    if (typeof i === 'number') {
      this.ids[model][i][platform] = localId;
      Object.keys(foreignIds).forEach((otherPlatform) => {
        this.ids[model][i][otherPlatform] = foreignIds[otherPlatform];
        this.index[model]![otherPlatform]![foreignIds[otherPlatform]] = i;
      });
    } else {
      const toStore = JSON.parse(JSON.stringify(foreignIds));
      toStore[platform] = localId;
      if (typeof this.ids[model] === 'undefined') {
        this.ids[model] = [];
      }
      this.ids[model].push(toStore);
      i = this.ids[model].length - 1;
    }
    this.ensureIndexed(model, i);
  }
  storeEquivalences(equivalences: Equivalences): void {
    Object.keys(equivalences).forEach((model: string) => {
      // console.log('storeEquivalences', model);
      equivalences[model].forEach((thing: IdentifierMap) => {
        // console.log('storeEquivalences', model, thing);
        Object.keys(thing).forEach((platform: string) => {
          const filtered = JSON.parse(JSON.stringify(thing));
          delete filtered[platform];
          // console.log('storeEquivalences', model, thing, platform, filtered);
          if (Object.keys(filtered).length > 0) {
            this.storeIdentitiesFrom(
              model,
              platform,
              thing[platform],
              filtered,
            );
          }
        });
      });
    });
  }

  convert(
    model: string,
    fromPlatform: string,
    fromLocalId: string,
    toPlatform: string,
  ): string | number | undefined {
    const i: string | number | undefined =
      this.index[model]?.[fromPlatform]?.[fromLocalId];
    if (typeof i === 'number') {
      return this.ids[model][i][toPlatform];
    }
    return undefined;
  }
  convertForeignIds(
    fromPlatform: string,
    fromId: string,
    fromForeignIds: IdentifierMap,
    toPlatform: string,
  ): IdentifierMap {
    const copied = JSON.parse(JSON.stringify(fromForeignIds));
    delete copied[toPlatform];
    copied[fromPlatform] = fromId;
    return copied;
  }
}
