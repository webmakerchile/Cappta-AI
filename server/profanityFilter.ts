export const BLOCK_THRESHOLD = 3;

let customWords: string[] = [];

export function getCustomWords(): string[] {
  return customWords;
}

export function setCustomWords(words: string[]) {
  customWords = (Array.isArray(words) ? words : [])
    .filter(w => typeof w === "string")
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);
}

export function getBuiltinWords(): string[] {
  return PROFANITY_LIST;
}

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
  "culiao", "culiado", "culiada", "culiaos", "culia",
  "aweonao", "aweonado", "aweonada", "aweona", "aweonaos",
  "sacowea", "sacoewea", "saco de wea",
  "la wea", "que wea", "weon ql", "ql",
  "chucha", "chuchetumare", "chuchasumadre",
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
  "conchatumadre",
  "sorete", "soretes",
  "baboso", "babosa",
  "mamón", "mamon", "mamona",
  "pendejada", "pendejadas",
  "chingón", "chingona",
  "vergon", "vergota",
  "puñeta", "puñetas",
  "ojete", "ojetes",
  "prostituta",
  "ramera", "rameras",
  "desgraciado", "desgraciada", "desgraciados",
  "miserable", "miserables",
  "retrasado", "retrasada",
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
  "culiao", "culia",
  "aweonao", "aweona",
  "hijueputa",
  "malparid",
  "gonorre",
  "conchetuma",
  "chuchetuma",
  "maricon",
  "gilipollas",
  "pelotud",
  "bolud",
  "sacowea", "sacoewea",
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
  }

  for (const term of PARTIAL_MATCH_TERMS) {
    const normalizedTerm = normalizeText(term);
    const partialBoundary = new RegExp(`\\b${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    if (partialBoundary.test(normalized) || partialBoundary.test(deobfuscated)) {
      foundWords.add(term);
    }
  }

  for (const cw of customWords) {
    const normalizedCw = normalizeText(cw);
    if (normalizedCw.includes(" ")) {
      if (normalized.includes(normalizedCw) || deobfuscated.includes(normalizedCw)) {
        foundWords.add(cw);
      }
      continue;
    }
    const cwBoundary = new RegExp(`\\b${normalizedCw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (cwBoundary.test(normalized) || cwBoundary.test(deobfuscated)) {
      foundWords.add(cw);
    }
  }

  return {
    hasProfanity: foundWords.size > 0,
    words: Array.from(foundWords),
  };
}

export function getProfanityWarningMessage(warningCount: number): string {
  if (warningCount <= 1) {
    return "Oye, te pido que mantengamos una conversacion respetuosa. Estoy aqui para ayudarte de verdad, pero con vocabulario ofensivo no podemos avanzar. Dime tranqui en que te puedo ayudar.";
  }
  if (warningCount === 2) {
    return "Segundo aviso: necesito que me hables con respeto para poder seguir ayudandote. Si sigues con lenguaje inapropiado, tu chat sera bloqueado. Dale, partamos de nuevo, ¿en que te puedo ayudar?";
  }
  return "Tu chat ha sido bloqueado por uso reiterado de lenguaje inapropiado. Si necesitas ayuda, puedes contactar a soporte.";
}
