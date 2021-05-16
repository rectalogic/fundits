import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

export default async function funditCommand({
  event, client,
}: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
  const result = await client.views.publish({
    user_id: event.user,
    view: {
      type: 'home',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Fundit admin UI',
          },
        },
      ],
    },
  });
  console.log(result);
}
