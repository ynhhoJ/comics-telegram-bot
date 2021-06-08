import axios from 'axios';

import { isNil } from 'lodash';
import { InlineQueryResultArticle } from 'typegram/inline';
import { parse } from 'node-html-parser';
import Utils from '../utils';

enum Sites {
  DORAMA = 'doramatv.live',
}

class MangaLibrary {
  private static generateDescription(
    comicsName: string,
    comicsLink: string,
    coverLink: string,
    description: string,
  ): string {
    let text = `<a href="${coverLink}">&#8205;</a>`;
    text += `<a href="${comicsLink}">${comicsName}</a>\n`;
    text += String(description);

    return text;
  }

  private static fixLink(link: string): string {
    // NOTE: https://stackoverflow.com/a/59897765
    const regex = /.+\/\/|www.|\..+/g;
    const nameFromLink = link.replace(regex, '');

    switch (nameFromLink) {
      case Sites.DORAMA:
        return link;

      default:
        return link;
    }
  }

  public static async findComics(searchText: string): Promise<Array<InlineQueryResultArticle>> {
    const axiosResult = await axios.post(`${process.env.READ_MANGA_LIVE_SITE}search?q=${encodeURI(searchText)}`);
    const mainComponent = parse(axiosResult.data).querySelectorAll('#mangaResults div.tiles.row .tile');
    const result: Array<InlineQueryResultArticle> = [];

    mainComponent.forEach((manga, index) => {
      if (index >= 50) {
        return;
      }

      // eslint-disable-next-line prettier/prettier
      const [coverHTML, /* tagsHTML */, descHTML] = manga.querySelectorAll('div');

      if (isNil(coverHTML.querySelector('a img'))) {
        return;
      }

      try {
        const { 'data-original': coverImageRaw } = coverHTML.querySelector('a img').attrs;
        const image = coverImageRaw.replace('_p', '_o');
        const descriptionRaw = descHTML.querySelector('i noindex .html-popover-holder p');
        let description = '';

        if (!isNil(descriptionRaw)) {
          description = descriptionRaw.text;
        }

        const title = Utils.removeMultipleSpaces(descHTML.querySelector('h3').text);
        const link = this.fixLink(descHTML.querySelector('h3 a').attrs.href);

        result.push({
          type: 'article',
          id: index.toString(),
          title: title,
          thumb_url: image,
          description: description ?? '+',
          url: `${process.env.READ_MANGA_LIVE_SITE}${link}`,

          input_message_content: {
            message_text: this.generateDescription(title, link, image, description),
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          },
        });
      } catch (error) {
        console.log(error);
      }
    });

    return result;
  }
}

export default MangaLibrary;
