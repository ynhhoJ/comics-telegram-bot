interface CustomEnvironment extends NodeJS.ProcessEnv {
  BOT_TOKEN: string;
  COMICS_DB_SITE: string;
  READ_MANGA_LIVE_SITE: string;
}

declare global {
  namespace NodeJS {
    interface Process {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      env: CustomEnvironment;
    }
  }
}

export {};
