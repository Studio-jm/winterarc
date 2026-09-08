export type MealEstimate = {
  kcal: number;
  estimate: "high";
  matched: string[];
  portionFactor: number;
};

type Food = {
  keys: string[];
  kcalHigh: number;
  additive?: boolean;
};

const FOODS: Food[] = [
  { keys: ["pizza"], kcalHigh: 1250 },
  { keys: ["burger", "hamburger", "cheeseburger"], kcalHigh: 1150 },
  { keys: ["frites", "frite"], kcalHigh: 550, additive: true },
  { keys: ["pates", "pasta", "spaghetti", "tagliatelle", "penne"], kcalHigh: 950 },
  { keys: ["bolo", "bolognaise", "bolognese"], kcalHigh: 320, additive: true },
  { keys: ["riz"], kcalHigh: 700 },
  { keys: ["poulet", "chicken"], kcalHigh: 450, additive: true },
  { keys: ["steak", "entrecote", "entrecôte", "boeuf", "bœuf"], kcalHigh: 800 },
  { keys: ["saumon", "salmon"], kcalHigh: 650 },
  { keys: ["thon"], kcalHigh: 500 },
  { keys: ["salade"], kcalHigh: 480 },
  { keys: ["cesar", "césar"], kcalHigh: 220, additive: true },
  { keys: ["wrap"], kcalHigh: 720 },
  { keys: ["sandwich", "jambon beurre", "jambon-beurre"], kcalHigh: 680 },
  { keys: ["croissant"], kcalHigh: 340 },
  { keys: ["pain au chocolat", "chocolatine"], kcalHigh: 380 },
  { keys: ["baguette"], kcalHigh: 540 },
  { keys: ["fromage"], kcalHigh: 420, additive: true },
  { keys: ["yaourt", "yogurt", "skyr"], kcalHigh: 220 },
  { keys: ["granola", "muesli"], kcalHigh: 450 },
  { keys: ["avoine", "porridge", "flocon"], kcalHigh: 380 },
  { keys: ["oeuf", "œuf", "omelette"], kcalHigh: 360 },
  { keys: ["avocat"], kcalHigh: 320, additive: true },
  { keys: ["soupe", "veloute", "velouté"], kcalHigh: 280 },
  { keys: ["quiche"], kcalHigh: 780 },
  { keys: ["tartiflette"], kcalHigh: 1300 },
  { keys: ["raclette", "fondue"], kcalHigh: 1400 },
  { keys: ["couscous"], kcalHigh: 1100 },
  { keys: ["tajine", "tagine"], kcalHigh: 950 },
  { keys: ["poke"], kcalHigh: 850 },
  { keys: ["sushi", "maki", "california"], kcalHigh: 700 },
  { keys: ["ramen"], kcalHigh: 980 },
  { keys: ["pad thai", "padthai"], kcalHigh: 1050 },
  { keys: ["curry"], kcalHigh: 900 },
  { keys: ["dahl", "dal"], kcalHigh: 620 },
  { keys: ["falafel"], kcalHigh: 640 },
  { keys: ["houmous", "hummus"], kcalHigh: 360, additive: true },
  { keys: ["gateau", "gâteau", "tarte", "brownie"], kcalHigh: 520 },
  { keys: ["chocolat"], kcalHigh: 280, additive: true },
  { keys: ["glace", "ice cream"], kcalHigh: 380 },
  { keys: ["biere", "bière", "beer"], kcalHigh: 220, additive: true },
  { keys: ["vin"], kcalHigh: 180, additive: true },
  { keys: ["coca", "soda"], kcalHigh: 180, additive: true },
  { keys: ["jus"], kcalHigh: 160, additive: true },
  { keys: ["smoothie"], kcalHigh: 420 },
  { keys: ["cafe", "café", "espresso"], kcalHigh: 20 },
  { keys: ["banane"], kcalHigh: 140, additive: true },
  { keys: ["pomme"], kcalHigh: 110, additive: true },
  { keys: ["compote"], kcalHigh: 130 },
  { keys: ["barre"], kcalHigh: 280 },
  { keys: ["proteine", "protéine", "whey"], kcalHigh: 180 },
  { keys: ["crepe", "crêpe", "pancake"], kcalHigh: 620 },
  { keys: ["gaufre"], kcalHigh: 540 },
  { keys: ["nugget"], kcalHigh: 720 },
  { keys: ["kebab", "durum", "dürüm"], kcalHigh: 1100 },
  { keys: ["tacos", "taco"], kcalHigh: 1200 },
  { keys: ["burrito"], kcalHigh: 1050 },
  { keys: ["chili"], kcalHigh: 780 },
  { keys: ["lasagne", "lasagna"], kcalHigh: 1100 },
  { keys: ["risotto"], kcalHigh: 880 },
  { keys: ["gnocchi"], kcalHigh: 820 },
  { keys: ["puree", "purée"], kcalHigh: 420, additive: true },
  { keys: ["legume", "legumes", "haricot", "brocoli"], kcalHigh: 180, additive: true },
];

const UNKNOWN_HIGH = 750;

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9+x/. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function fuzzyHas(hay: string, needle: string): boolean {
  if (hay.includes(needle)) return true;
  if (needle.length < 4) return false;
  const words = hay.split(" ");
  const max = needle.length >= 8 ? 2 : 1;
  return words.some((w) => w.length >= 4 && levenshtein(w, needle) <= max);
}

function portionFactor(portion: string | null | undefined, text: string): number {
  const src = fold(`${portion ?? ""} ${text}`);
  if (/\b(double|2x|x2|deux parts)\b/.test(src)) return 2;
  if (/\b(triple|3x)\b/.test(src)) return 3;
  if (/\b(demi|1\/2|0\.5)\b/.test(src)) return 0.5;
  if (/\b(petit|petite|small)\b/.test(src)) return 0.75;
  if (/\b(grand|grande|grosse|gros|large|xl)\b/.test(src)) return 1.4;
  if (/\b(moyen|moyenne|normal)\b/.test(src)) return 1;
  return 1;
}

export function estimateMeal(text: string, portion?: string | null): MealEstimate {
  const folded = fold(text);
  const matched: { key: string; kcalHigh: number; additive: boolean }[] = [];
  for (const food of FOODS) {
    for (const key of food.keys) {
      const k = fold(key);
      if (!k) continue;
      if (fuzzyHas(folded, k)) {
        matched.push({ key: k, kcalHigh: food.kcalHigh, additive: Boolean(food.additive) });
        break;
      }
    }
  }

  let kcal: number;
  const names = matched.map((m) => m.key);
  if (matched.length === 0) {
    kcal = UNKNOWN_HIGH;
  } else {
    const bases = matched.filter((m) => !m.additive);
    const adds = matched.filter((m) => m.additive);
    if (bases.length === 0) {
      kcal = matched.reduce((s, m) => s + m.kcalHigh, 0);
    } else {
      kcal = Math.max(...bases.map((m) => m.kcalHigh)) + adds.reduce((s, m) => s + m.kcalHigh, 0);
    }
  }

  const factor = portionFactor(portion, text);
  const high = Math.ceil((kcal * factor) / 10) * 10;
  return {
    kcal: high,
    estimate: "high",
    matched: names,
    portionFactor: factor,
  };
}
