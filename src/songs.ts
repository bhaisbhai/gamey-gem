export interface Song {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  startAt: number;
}

export const DAILY_SONGS: Song[] = [
  {
    id: "1",
    youtubeId: "YykjpeuMNEk", // Coldplay - Yellow
    title: "YELLOW",
    artist: "COLDPLAY",
    startAt: 0
  },
  {
    id: "2",
    youtubeId: "hT_nvWreIhg", // One Direction - What Makes You Beautiful
    title: "WHAT MAKES YOU BEAUTIFUL",
    artist: "ONE DIRECTION",
    startAt: 0
  },
  {
    id: "3",
    youtubeId: "09R8_2nJtjg", // Maroon 5 - Sugar
    title: "SUGAR",
    artist: "MAROON 5",
    startAt: 45
  },
  {
    id: "4",
    youtubeId: "9bZkp7q19f0", // Psy - Gangnam Style
    title: "GANGNAM STYLE",
    artist: "PSY",
    startAt: 10
  },
  {
    id: "5",
    youtubeId: "fKopy74weus", // Imagine Dragons - Thunder
    title: "THUNDER",
    artist: "IMAGINE DRAGONS",
    startAt: 0
  },
  {
    id: "6",
    youtubeId: "rtOvBOTyX00", // Christina Perri - A Thousand Years
    title: "A THOUSAND YEARS",
    artist: "CHRISTINA PERRI",
    startAt: 60
  }
];
