import axios from 'axios';
import HTMLElement from 'node-html-parser/dist/nodes/html';
import { parse } from 'node-html-parser';
import { InlineQueryResultArticle } from 'typegram/inline';
import Utils from '../utils';

class ComicsDatabase {
  private static getComicsStatus(status: string): string {
    switch (status) {
      case 'fa fa-play text-success':
        return 'Перевод продолжается';
      case 'fa fa-check text-success':
        return 'Перевод закончен';
      case 'fa fa-stop-circle text-danger':
        return 'Перевод заморожен';
      case 'fa fa-question-circle':
        return 'Статус неизвестен';
      default:
        return '';
    }
  }

  private static generateDescription(
    status: string,
    comicsName: string,
    comicsLink: string,
    translated: string,
    maxComics: string,
    coverLink: string,
  ): string {
    // TODO(VG): Remove hard replace
    const linkToComics = (process.env.COMICS_DB_SITE + comicsLink).replace('ru//', 'ru/');

    let text = `<a href="${coverLink}">&#8205;</a>`;
    text += `<a href="${linkToComics}">${comicsName}</a>\n`;
    text += `<code>${translated}/${maxComics}</code>\n`;
    text += `<code>${status}</code>\n`;

    return text;
  }

  public static async findComics(searchText: string): Promise<Array<InlineQueryResultArticle>> {
    const axiosResult = await axios.get(`${process.env.COMICS_DB_SITE}search/comics/${encodeURI(searchText)}`);
    const mainComponent = parse(axiosResult.data).querySelectorAll('.container tbody tr');
    const result: InlineQueryResultArticle[] = [];

    mainComponent.forEach((comics, index) => {
      if (index >= 50) {
        return;
      }

      try {
        // eslint-disable-next-line prettier/prettier
        const [/* id */, translateStatusHTML,
          coverHTML,
          nameHTML,
          progressTranslatedHTML,
          translatedHTML] = comics.querySelectorAll('td');
        const nameRaw = nameHTML.childNodes[1] as HTMLElement;
        const statusHTML = translateStatusHTML.childNodes[1] as HTMLElement;
        const statusRaw = statusHTML.attrs.class;
        const comicsCoverHTML = coverHTML.childNodes[1] as HTMLElement;
        const cover = comicsCoverHTML.attrs.href;
        const link = nameRaw.attrs.href;
        // TODO: Remove hard replace
        const linkToComics = (process.env.COMICS_DB_SITE + link).replace('ru//', 'ru/');
        const maxValue = translatedHTML.childNodes[0].text;
        const name = Utils.removeMultipleSpaces(nameRaw.childNodes[0].text);
        const status = ComicsDatabase.getComicsStatus(statusRaw);
        const translated = progressTranslatedHTML.childNodes[0].childNodes[0].text;
        const messageDescription = ComicsDatabase.generateDescription(
          status,
          name,
          linkToComics,
          translated,
          maxValue,
          cover,
        );

        result.push({
          type: 'article',
          id: linkToComics,
          title: name,
          thumb_url: cover,
          description: `${status}\nПереведено ${translated} из ${maxValue}`,
          url: linkToComics,

          input_message_content: {
            message_text: messageDescription,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          },
        });
      } catch (error) {
        console.error(error);
      }
    });

    return result;
  }
}

export default ComicsDatabase;
