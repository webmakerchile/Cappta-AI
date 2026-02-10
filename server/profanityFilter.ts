export const BLOCK_THRESHOLD = 3;

export const PROFANITY_LIST: string[] = [
  "maldito", "maldita", "malditos", "malditas",
  "puto", "puta", "putos", "putas", "putita", "putito",
  "pendejo", "pendeja", "pendejos", "pendejas",
  "idiota", "idiotas",
  "imbecil", "imbécil", "imbeciles",
  "estupido", "estupida", "estúpido", "estúpida", "estupidos", "estupidas",
  "cabron", "cabrona", "cabrones", "cabronas",
  "verga", "vergas", "vergudo",
  "chinga", "chingada", "chingado", "chingar", "chingas", "chingadera", "chingon",
  "pinche", "pinches",
  "culero", "culera", "culeros",
  "culo", "culos",
  "mierda", "mierdas", "mierdero",
  "hijo de puta", "hija de puta",
  "hdp",
  "ctm",
  "conchetumare", "conchetumadre", "conchasumadre", "conchesumadre",
  "weon", "weón", "wea", "weona", "weonas", "weones",
  "huevon", "huevona", "huevones",
  "maricon", "maricón", "marica", "maricas", "maricones",
  "zorra", "zorras",
  "perra", "perras", "perro",
  "basura", "basuras",
  "tarado", "tarada", "tarados",
  "inutil", "inútil", "inutiles",
  "mongol", "mongola", "mongolico", "mongolica",
  "subnormal", "subnormales",
  "gilipollas", "gilipolla",
  "coño", "coños",
  "carajo", "carajos",
  "joder", "jodido", "jodida", "jodidos",
  "mamaguevo", "mamaguevos", "mamagüevo",
  "malparido", "malparida", "malparidos",
  "gonorrea", "gonorreas",
  "hijueputa", "hijueputas", "jueputa", "jueperra",
  "hp",
  "csm",
  "bastardo", "bastarda", "bastardos",
  "cretino", "cretina", "cretinos",
  "pelotudo", "pelotuda", "pelotudos",
  "boludo", "boluda", "boludos",
  "forro", "forra", "forros",
  "pajero", "pajera",
  "concha", "conchatumadre",
  "sorete", "soretes",
  "baboso", "babosa",
  "naco", "naca", "nacos",
  "mamón", "mamon", "mamona",
  "pendejada", "pendejadas",
  "chingón", "chingona",
  "vergon", "vergota",
  "puñeta", "puñetas",
  "coger", "cogida",
  "ojete", "ojetes",
  "nalgas",
  "prostituta",
  "ramera", "rameras",
  "desgraciado", "desgraciada", "desgraciados",
  "miserable", "miserables",
  "asco",
  "asqueroso", "asquerosa",
  "cerdo", "cerda",
  "cochino", "cochina",
  "animal",
  "bestia",
  "bruto", "bruta",
  "torpe",
  "tonto", "tonta", "tontos", "tontas",
  "retrasado", "retrasada",
  "anormal",
  "hdlgp",
  "ptm", "pqtp",
  "stfu",
  "wtf",
  "lcdtm",
  "tmr",
  "laconchadetumadre",
  "laconchadetumare",
];

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function deobfuscate(text: string): string {
  let result = text.toLowerCase();
  for (const [key, value] of Object.entries(LEET_MAP)) {
    result = result.split(key).join(value);
  }
  return result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function removeSpacesVariant(text: string): string {
  return text.replace(/\s+/g, "");
}

const PARTIAL_MATCH_TERMS = [
  "put", "puta", "puto",
  "mierda",
  "verg",
  "ching",
  "cabron",
  "pendej",
  "culer",
  "hijueputa",
  "malparid",
  "gonorre",
  "conchetuma",
  "maricon",
  "gilipollas",
  "pelotud",
  "bolud",
];

export function containsProfanity(text: string): { hasProfanity: boolean; words: string[] } {
  const foundWords: Set<string> = new Set();
  const normalized = normalizeText(text);
  const deobfuscated = deobfuscate(text);
  const collapsed = removeSpacesVariant(normalized);
  const collapsedDeobfuscated = removeSpacesVariant(deobfuscated);

  const normalizedList = PROFANITY_LIST.map((w) => normalizeText(w));

  for (let i = 0; i < PROFANITY_LIST.length; i++) {
    const word = normalizedList[i];
    const original = PROFANITY_LIST[i];

    if (word.includes(" ")) {
      if (normalized.includes(word) || deobfuscated.includes(word)) {
        foundWords.add(original);
      }
      const compacted = word.replace(/\s+/g, "");
      if (collapsed.includes(compacted) || collapsedDeobfuscated.includes(compacted)) {
        foundWords.add(original);
      }
      continue;
    }

    const wordBoundary = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (wordBoundary.test(normalized) || wordBoundary.test(deobfuscated)) {
      foundWords.add(original);
    }

    if (collapsed.includes(word) || collapsedDeobfuscated.includes(word)) {
      foundWords.add(original);
    }
  }

  for (const term of PARTIAL_MATCH_TERMS) {
    const normalizedTerm = normalizeText(term);
    if (normalized.includes(normalizedTerm) || deobfuscated.includes(normalizedTerm) ||
        collapsed.includes(normalizedTerm) || collapsedDeobfuscated.includes(normalizedTerm)) {
      foundWords.add(term);
    }
  }

  return {
    hasProfanity: foundWords.size > 0,
    words: Array.from(foundWords),
  };
}

export function getProfanityWarningMessage(warningCount: number): string {
  if (warningCount <= 1) {
    return "Tu mensaje contiene lenguaje inapropiado. Por favor, se respetuoso.";
  }
  if (warningCount === 2) {
    return "Segundo aviso: el uso de lenguaje ofensivo no esta permitido. Al tercer aviso tu chat sera bloqueado.";
  }
  return "Tu chat ha sido bloqueado por uso reiterado de lenguaje inapropiado. Contacta a soporte si crees que fue un error.";
}
