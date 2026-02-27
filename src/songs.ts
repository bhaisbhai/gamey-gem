export interface Song {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  startAt: number;
  emojis: string;
}

export const DAILY_SONGS: Song[] = [
  {
    id: "1",
    youtubeId: "YykjpeuMNEk",
    title: "YELLOW",
    artist: "COLDPLAY",
    startAt: 0,
    emojis: "🟡⭐🌻🍋"
  },
  {
    id: "2",
    youtubeId: "hT_nvWreIhg",
    title: "WHAT MAKES YOU BEAUTIFUL",
    artist: "ONE DIRECTION",
    startAt: 0,
    emojis: "👸✨💖🌅"
  },
  {
    id: "3",
    youtubeId: "09R8_2nJtjg",
    title: "SUGAR",
    artist: "MAROON 5",
    startAt: 45,
    emojis: "🍬🍭🍰🧁"
  },
  {
    id: "4",
    youtubeId: "9bZkp7q19f0",
    title: "GANGNAM STYLE",
    artist: "PSY",
    startAt: 10,
    emojis: "🏇🕶️🕺🇰🇷"
  },
  {
    id: "5",
    youtubeId: "fKopy74weus",
    title: "THUNDER",
    artist: "IMAGINE DRAGONS",
    startAt: 0,
    emojis: "⚡⛈️🌩️🥁"
  },
  {
    id: "6",
    youtubeId: "rtOvBOTyX00",
    title: "A THOUSAND YEARS",
    artist: "CHRISTINA PERRI",
    startAt: 60,
    emojis: "👰⏳💍🧛"
  }
];
