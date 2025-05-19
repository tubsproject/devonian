import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianIndex, ForeignIds } from '../src/DevonianIndex.js';

export type SlackMessage = {
  ts?: string,
  user?: string,
  channel: string,
  text: string,
  foreignIds: ForeignIds,
};

export function slackMetadataToForeignIds(metadata:  {
  event_type: string;
  event_payload: {
    foreignIds?: object;
  };
} | undefined): object {
  if (metadata?.event_payload?.foreignIds) {
    return metadata.event_payload.foreignIds;
  }
  return {};
}

export function foreignIdsToSlackMetadata(foreignIds: object): object {
  return {
    event_type: 'devonian',
    event_payload: {
      foreignIds,
    },
  };
}

export class SlackMessageClient extends DevonianClient<SlackMessage> {
  index: DevonianIndex;
  constructor(index: DevonianIndex) {
    super();
    this.index = index;
    this.on('add', (obj: SlackMessage) => {
      console.log('incoming slack message');
      this.index.storeIdentitiesFrom('message', 'slack', obj.ts, obj.foreignIds);
    });
  }

  async add(obj: SlackMessage): Promise<string> {
    console.log('make an API call to post this message to Slack', obj);
    return 'ts';
  }
}
    
