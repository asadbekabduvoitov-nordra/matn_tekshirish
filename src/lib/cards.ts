export type TCard = {
  card_number: string;
  card_holder: string;
};

export const cards: TCard[] = [
  {
    card_number: "5614 6824 1984 8736",
    card_holder: "MAXKAMOV UMIDJON",
  },
  {
    card_number: "9860 1801 0475 4882",
    card_holder: "UMIDJON MAKHKAMOV",
  },
  {
    card_number: "9860 1801 0478 7148",
    card_holder: "NOSIRJON MAKHKAMOV",
  },
  {
    card_number: "5614 6824 1681 7171",
    card_holder: "MAXKAMOV NOSIRJON",
  },
  {
    card_number: "9860 1801 0483 7059",
    card_holder: "MUSLIMBEK MAMURJONOV",
  },
  {
    card_number: "9860 1801 0431 2277",
    card_holder: "FAZLIDDIN MAMURJONOV",
  },
  {
    card_number: "5614 6824 1592 0166",
    card_holder: "MAMURJONOV FAZLIDDIN",
  },
  {
    card_number: "5614 6824 1533 6215",
    card_holder: "MAMURJONOV MUSLIMBEK",
  },
  {
    card_number: "5614 6824 1120 2809",
    card_holder: "MAXKAMOVA MUYASSARXON",
  },
  {
    card_number: "9860 1801 0488 6718",
    card_holder: "MUYASSARKHON MAKHKAMOVA",
  },
];

export function getRandomCard(): TCard {
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}
