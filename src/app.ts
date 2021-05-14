import { App, LogLevel } from '@slack/bolt';
import { isGenericMessageEvent, Rx } from './utils/helpers';
import { Database } from './data';

const USAGE = 'Usage: /fundit @username NNN';
const USERID_REGEX = /<@(?<userid>\w+)(?=(?:\|)|>)/;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG,
});

app.command('/fundit', async ({ command, client, ack, say, respond }) => {
  await ack();
  const database = new Database();
  // Respond with balances if no input
  const user = await database.findUser(command.user_id);
  if (!command.text || command.text === 'help') {
    await respond({
      text: `You have ${Rx}${user.funditsBalance} left to give, you have received ${Rx}${user.funditsReceived}\n${USAGE}`,
      response_type: 'ephemeral',
    });
  } else {
    // Parse a fundit transfer
    const args = command.text.split(/\s+/);
    if (args.length !== 2) {
      await respond({ text: USAGE, response_type: 'ephemeral' });
    }
    const [ toUserIdMention, amountStr ] = args;
    const match = toUserIdMention.match(USERID_REGEX);
    if (match && match.groups?.userid) {
      const response = await client.users.info({ user: match.groups.userid})
      if (response.user?.id) {
        const amount = parseFloat(amountStr);
        if (amount) {
          database.transferFundits(user.userId, response.user.id, amount);
          await say(`<@${user.userId}> gave <@${response.user.id}> ${Rx}${amount} fundits!`);
        } else {
          await respond({ text: `Invalid amount ${amountStr}.\n${USAGE}`, response_type: 'ephemeral' });
        }
      } else {
        await respond({ text: `Invalid user.\n${USAGE}`, response_type: 'ephemeral' });
      }
    } else {
      await respond({ text: `Invalid user.\n${USAGE}`, response_type: 'ephemeral' });
    }
  }
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // Filter out message events with subtypes (see https://api.slack.com/events/message)
  // Is there a way to do this in listener middleware with current type system?
  if (!isGenericMessageEvent(message)) return;
  // say() sends a message to the channel where the event was triggered

  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey there <@${message.user}>!`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Click Me',
          },
          action_id: 'button_click',
        },
      },
    ],
    text: `Hey there <@${message.user}>!`,
  });
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

(async () => {
  // Start your app
  await app.start(Number(process.env.PORT) || 3000);

  console.log('⚡️ Bolt app is running!');
})();
