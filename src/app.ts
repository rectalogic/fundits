import { App, LogLevel } from '@slack/bolt';
import Rx from './utils';
import funditCommand from './command';
import funditHome from './admin';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG,
});

app.command('/fundit', async (args) => {
  try {
    await funditCommand(args);
  } catch (err) {
    console.log(err);
    await args.respond({ text: `${err}`, response_type: 'ephemeral' });
  }
});

app.event('app_home_opened', async (args) => {
  try {
    await funditHome(args);
  } catch (err) {
    console.log(err);
    await args.client.views.publish({
      user_id: args.event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: err,
            },
          },
        ],
      },
    });
  }
});

(async () => {
  await app.start(Number(process.env.PORT) || 3000);
  console.log(`${Rx} Fundit app is running!`);
})();
