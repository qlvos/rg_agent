import { config } from './../config/config.js';
import { RG_SEND_TG } from './../config/eventkeys.js';
import { sendPrompt } from './../util/util.js';
import { CHAT_BUCKET, addToBucket } from '../memorymanager.js';
import { CHAT_PROMPT } from './baseprompts.js';

/*

Expected format for the judge

{
  from: psuede
  content: "Why is it the best?"
  conversation: [
    {
      from: Reaper
      to: psuede
      content: "RG is the best token ever"
    },
    {
      from: psuede
      to: Reaper
      content: "What is RG?"
    },
  ]
}

*/

export async function manageChat(msg, redis) {
  let prompt = `${msg.content}`;
  let res = await sendPrompt(CHAT_PROMPT, prompt);
  if(res) {
    addToBucket(CHAT_BUCKET, prompt, redis);
    addToBucket(CHAT_BUCKET, res.message, redis);
    await redis.publish(config.RG_EVENT_KEY, JSON.stringify(
      { event: RG_SEND_TG, 
        message: res.message,
        replyTo: msg.conversation[msg.conversation.length-1].messageid
      }));
  }
}