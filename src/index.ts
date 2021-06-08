import { Context, Telegraf, session } from 'telegraf';

import { InlineQueryResultArticle } from 'typegram/inline';
import ComicsDatabase from './site/comicsdb';
import MangaLibrary from './site/mangalib';

type Nullable<T> = T | null | undefined;

interface SessionData {
  messageCount: number;
}

interface MyContext extends Context {
  session?: SessionData;
}

class Telegram extends Telegraf<MyContext> {
  constructor() {
    super(process.env.BOT_TOKEN ?? '');
  }

  private static getSessionKey(context: MyContext): Nullable<string> {
    if (!context.from) return undefined; // should never happen

    let chatInstance;

    if (context.chat) {
      chatInstance = context.chat.id;
    } else if (context.updateType === 'callback_query') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chatInstance = context.callbackQuery.chat_instance;
    } else {
      chatInstance = context.from.id;
    }

    return `${chatInstance}:${context.from.id}`;
  }

  public async initialize(): Promise<void> {
    super.use(session());
    super.start((context) => context.reply('Hello World!'));
    super.on('message', (context) => {
      context.reply(`Your session keys is: ${Telegram.getSessionKey(context)}`);
    });
    super.on('inline_query', async (context) => {
      const { query } = context.inlineQuery;

      if (query.length <= 2) {
        return;
      }

      const inlineList: Array<InlineQueryResultArticle> = [];
      const result = await ComicsDatabase.findComics(query);

      inlineList.push(...result);

      const manga = await MangaLibrary.findComics(query);

      inlineList.push(...manga);

      if (inlineList.length >= 49) {
        inlineList.length = 49;
      }

      context.answerInlineQuery(inlineList);
    });

    // NOTE: Selected user result. Should be used in future for statistics.
    // super.on('chosen_inline_result', (context) => {
    //   const result = context.update;
    //   console.log(result);
    // });

    await super.launch();
  }
}

const bot = new Telegram();
bot.initialize();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
