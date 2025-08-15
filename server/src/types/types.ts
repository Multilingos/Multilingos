export type ServerError = {
  log: string;
  status: number;
  message: { err: string };
};

export interface TranslatorMetadata {
  lang: "en" | "zh";
  text: string;
  translation?: string;
  pinyin?: string;
  pair_id?: string;

  [k: string]: string | number | boolean | string | string[]; 
}