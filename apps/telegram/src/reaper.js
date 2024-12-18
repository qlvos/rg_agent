import { logger } from './logger.js';
import { config } from './config/config.js';
import { Api } from 'telegram';
import { RG_SEND_TG, RG_SEND_TG_BUY_REACTION, RG_SEND_TG_TWEET_SUGGESTION } from './config/eventkeys.js';
import { addTelegramMessage } from './db/postgresdbhandler.js'

export async function subscribeToChatEvent(tgClient, redis) {
  await redis.subscribe(config.RG_EVENT_KEY, async (message) => {
    manageRgEvent(JSON.parse(message), tgClient);
  });
}

async function manageRgEvent(msg, tgClient) {
  if(msg.event != RG_SEND_TG && msg.event != RG_SEND_TG_BUY_REACTION && msg.event != RG_SEND_TG_TWEET_SUGGESTION) {
    return;
  }

  try {
    // typing ...
    await tgClient.invoke(new Api.messages.SetTyping({ peer: msg.chatId, action: new Api.SendMessageTypingAction({}) }));
    let delay = getTypingDelay(msg.message);

    let secondTypingThreshold = 5000;
    if (delay > secondTypingThreshold) {
      await new Promise(resolve => setTimeout(resolve, secondTypingThreshold));
      delay -= secondTypingThreshold;
      tgClient.invoke(new Api.messages.SetTyping({ peer: msg.chatId, action: new Api.SendMessageTypingAction({}) }));
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    let messageSent = await tgClient.sendMessage(msg.chatId, msg );
   
    if(msg.event != RG_SEND_TG_TWEET_SUGGESTION) {
      await addTelegramMessage(msg.chatId, config.TG_REAPER_ID, messageSent.message, false, Date.now(), messageSent.id, msg.replyTo);
    }

  } catch (err) {
    logger.error(err);
  }
}

function getTypingDelay(msg) {
  let MIN_SHORT_TYPING_DELAY = 2 * 1000;
  let MAX_SHORT_TYPING_DELAY = randomNumber(3) * 1000;
  let MIN_LONG_TYPING_DELAY = 3 * 1000;
  let MAX_LONG_TYPING_DELAY = randomNumber(6) * 1000;
  return msg.length < 10 ? Math.max(MIN_SHORT_TYPING_DELAY, MAX_SHORT_TYPING_DELAY) : Math.max(MIN_LONG_TYPING_DELAY, MAX_LONG_TYPING_DELAY);
}

function randomNumber(max) {
  return Math.floor(Math.random() * (max + 1));
}