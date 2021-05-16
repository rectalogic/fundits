import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';
import Rx from './utils';
import { Database } from './data';

const USAGE = 'Usage: /fundit @username NNN';
const USERID_REGEX = /<@(?<userid>\w+)(?=(?:\|)|>)/;

export default async function funditCommand({
  command, client, ack, say, respond,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
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
    const [toUserIdMention, amountStr] = args;
    const match = toUserIdMention.match(USERID_REGEX);
    if (match && match.groups?.userid) {
      const response = await client.users.info({ user: match.groups.userid });
      if (response.user?.id) {
        const amount = parseFloat(amountStr);
        if (amount) {
          try {
            await database.transferFundits(user.userId, response.user.id, amount);
            await say(`<@${user.userId}> gave <@${response.user.id}> ${Rx}${amount} fundits!`);
          } catch (err) {
            await respond({ text: `${err}.\n${USAGE}`, response_type: 'ephemeral' });
          }
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
}
