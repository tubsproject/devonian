import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import { DevonianIndex } from '../../src/DevonianIndex.js';
import { SolidMessage } from '../../examples/DevonianSolid.js';
import { SlackMessage } from '../../examples/DevonianSlack.js';
import { DevonianSolidSlackBridge } from '../../examples/DevonianSolidSlackBridge.js';

class MockClient<Model> extends EventEmitter {
  added: Model[] = [];
  counter: number = 0;
  async add(obj: Model): Promise<string> {
    // console.log('adding in mock client', obj);
    this.added.push(obj);
    return (this.counter++).toString();
  }
  fakeIncoming(obj: Model): void {
    // console.log('fake incoming in mock client', obj);
    this.emit('incoming', obj);
  }
}

describe('DevonianSolidSlackBridge', () => {
  const index = new DevonianIndex();
  const solidMockClient = new MockClient<SolidMessage>;
  const slackMockClient = new MockClient<SlackMessage>;
  new DevonianSolidSlackBridge(index, solidMockClient, slackMockClient);
  // console.log('Solid is left, Slack is right');
  it('can go from Solid to Slack', async () => {
    solidMockClient.fakeIncoming({
      uri: 'https://example.com/chat/2025/05/05/chat.ttl#Msg1',
      chatUri: 'https://example.com/chat/index.ttl',
      authorWebId: 'https://example.com/profile/card#me',
      text: 'solid text',
      foreignIds: {
        'asdf': 'qwer',
      },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(slackMockClient.added).toEqual([{
      ts: undefined,
      channel: undefined,
      text: 'solid text',
      user: undefined,
      foreignIds: { asdf: 'qwer', solid: 'https://example.com/chat/2025/05/05/chat.ttl#Msg1' }
    }]);
  });

  it('can go from Slack to Solid', async () => {
    slackMockClient.fakeIncoming({
      ts: '1234567890.123',
      channel: 'slack channel',
      user: 'slack user',
      text: 'slack text',
      foreignIds: {
        'asdf': 'qwer',
      },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(solidMockClient.added).toEqual([{
      uri: undefined,
      chatUri: undefined,
      text: 'slack text',
      authorWebId: undefined,
      date: new Date('2009-02-13T23:31:30.123Z'),
      foreignIds: { asdf: 'qwer', slack: '1234567890.123' }
    }]);
  });
});