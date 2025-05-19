

// export type DevonianObject = {
//   getId: () => string
// };

// export type SlackChannel = DevonianObject & {};
// export type SlackUser = DevonianObject & {};

// export type SlackMessage = DevonianObject & {
//     setUser: (SlackUser) => void,
//     getUser: () => SlackUser | undefined,
//     text: string,
//     setChannel: (SlackChannel) => void,
//     getChannel: () => SlackChannel | undefined,
// };

// const slackChannelTable: DevonianTable<SlackChannel> = {
//   add: async (channel: SlackChannel) => {
//     console.log(channel);
//   },
//   onAdd: async (channel: SlackChannel) => {
//     console.log(channel);    
//   },
// }
 
// console.log(slackChannelTable);