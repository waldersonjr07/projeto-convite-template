const VOWEL_REGEX = /[aeiouáéíóúâêîôûãõàü]/i;
const ONLY_LETTERS_AND_SPACES_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
const REPEATED_CHARS_REGEX = /([A-Za-zÀ-ÖØ-öø-ÿ])\1{2,}/i;

// Encontros consonantais improváveis em nomes reais (típicos de batida aleatória no teclado como "hdahdbaj")
const MASHED_CONSONANT_CLUSTERS_REGEX =
  /(hd|dh|db|bd|df|fd|fg|gf|fh|hf|gj|jg|hj|jh|jk|kj|kl|lk|zx|xz|cv|vc|bn|nb|qw|wq|sd|ds|gb|bg|hb|bh|jb|bj|kb|bk)/i;

const BLOCKED_SEQUENCES = [
  'asdf',
  'fdsa',
  'qwer',
  'rewq',
  'zxcv',
  'vcxz',
  'hjkl',
  'lkjh',
  'uiop',
  'poiu',
  'abcd',
  'efgh',
  'ijkl',
  'hdah',
  'dbaj',
  'teste',
  'test',
  'fulano',
  'ciclano',
  'beltrano',
  'blabla',
  'xablau',
  'huehue',
  'hahaha',
  'hehehe',
  'rsrsrs',
  'kkkk',
  'ninguem',
  'anonimo',
  'convidado',
  'pessoa',
  'qualquer',
];

const IGNORED_PREPOSITIONS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/**
 * Remove acentos, espaços extras e normaliza para minúsculas para busca geral.
 */
export function normalizeForComparison(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza um nome removendo acentos, pontuações (como pontos em abreviações "P.")
 * e preposições ("da", "de", "do", "das", "dos", "e"), retornando os tokens limpos.
 * @param {string} rawName
 * @returns {string[]}
 */
export function tokenizeGuestName(rawName) {
  if (!rawName || typeof rawName !== 'string') return [];
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !IGNORED_PREPOSITIONS.has(token));
}

/**
 * Calcula a distância de edição de Levenshtein entre duas strings em JS puro.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // remoção
        matrix[i][j - 1] + 1, // inserção
        matrix[i - 1][j - 1] + cost // substituição
      );
    }
  }

  return matrix[a.length][b.length];
}

function areTokensFullMatch(tokA, tokB) {
  if (tokA.length < 2 || tokB.length < 2) return false;
  if (tokA === tokB) return true;
  if (tokA.length >= 4 && tokB.length >= 4) {
    return levenshteinDistance(tokA, tokB) <= 1;
  }
  return false;
}

function areTokensCompatible(tokA, tokB) {
  if (areTokensFullMatch(tokA, tokB)) return true;
  // Iniciais de 1 letra casando com sobrenome completo (ex: "p" com "pedroso")
  if (tokA.length === 1 && tokB.length >= 2 && tokB.startsWith(tokA)) {
    return true;
  }
  if (tokB.length === 1 && tokA.length >= 2 && tokA.startsWith(tokB)) {
    return true;
  }
  return false;
}

/**
 * Verifica se todos os tokens do menor conjunto de sobrenomes casam com tokens distintos
 * do maior conjunto, exigindo pelo menos 1 sobrenome real compatível.
 */
function matchSurnameTokens(shorter, longer) {
  const usedLongerIndices = new Set();

  function backtrack(shortIdx, hasFullOrCrossSurname) {
    if (shortIdx === shorter.length) {
      return hasFullOrCrossSurname;
    }

    const sTok = shorter[shortIdx];
    for (let lIdx = 0; lIdx < longer.length; lIdx += 1) {
      if (usedLongerIndices.has(lIdx)) continue;
      const lTok = longer[lIdx];

      if (areTokensCompatible(sTok, lTok)) {
        usedLongerIndices.add(lIdx);
        const isStrongMatch =
          areTokensFullMatch(sTok, lTok) ||
          (sTok.length === 1 && lTok.length >= 3) ||
          (lTok.length === 1 && sTok.length >= 3);

        if (backtrack(shortIdx + 1, hasFullOrCrossSurname || isStrongMatch)) {
          return true;
        }
        usedLongerIndices.delete(lIdx);
      }
    }

    return false;
  }

  return backtrack(0, false);
}

/**
 * Compara dois nomes de convidados e classifica a duplicidade em 2 níveis:
 * - 'exact': tokens normalizados idênticos ("Nome Duplicado")
 * - 'probable': primeiro nome igual (ou Levenshtein <= 1 para 4+ letras) e sobrenomes compatíveis ("Possível Duplicado")
 * - null: pessoas diferentes
 *
 * @param {string} nameA
 * @param {string} nameB
 * @returns {'exact' | 'probable' | null}
 */
export function compareGuestNames(nameA, nameB) {
  const tokensA = tokenizeGuestName(nameA);
  const tokensB = tokenizeGuestName(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return null;

  // Nível 1: Duplicata Exata (todos os tokens normalizados coincidem na mesma ordem)
  if (
    tokensA.length === tokensB.length &&
    tokensA.every((tok, idx) => tok === tokensB[idx])
  ) {
    return 'exact';
  }

  // Nível 2: Possível Duplicado
  const firstA = tokensA[0];
  const firstB = tokensB[0];

  const isFirstNameCompatible =
    firstA === firstB ||
    (firstA.length >= 4 &&
      firstB.length >= 4 &&
      levenshteinDistance(firstA, firstB) <= 1);

  if (!isFirstNameCompatible) {
    return null;
  }

  const surnamesA = tokensA.slice(1);
  const surnamesB = tokensB.slice(1);

  if (surnamesA.length === 0 || surnamesB.length === 0) {
    return null;
  }

  // Deve existir pelo menos 1 sobrenome completo coincidente ou cruzamento de iniciais + sobrenome completo
  const hasAtLeastOneFullSurnameMatch = surnamesA.some((sA) =>
    surnamesB.some((sB) => areTokensFullMatch(sA, sB))
  );

  const hasCrossInitialAndFullMatch =
    surnamesA.length >= 2 &&
    surnamesB.length >= 2 &&
    surnamesA.some((sA) => sA.length >= 3) &&
    surnamesB.some((sB) => sB.length >= 3);

  if (!hasAtLeastOneFullSurnameMatch && !hasCrossInitialAndFullMatch) {
    return null;
  }

  const shorter =
    surnamesA.length <= surnamesB.length ? surnamesA : surnamesB;
  const longer =
    surnamesA.length <= surnamesB.length ? surnamesB : surnamesA;

  if (!matchSurnameTokens(shorter, longer)) {
    return null;
  }

  return 'probable';
}

/**
 * Gera a chave canônica ordenada para um par de IDs de convidados.
 */
export function getDuplicatePairKey(idA, idB) {
  return [String(idA), String(idB)].sort().join('|');
}

function normalizeText(value) {
  return normalizeForComparison(value);
}

/**
 * Validação pura anti-zoeira para nomes de convidados e acompanhantes.
 * @param {string} rawName
 * @param {string} fieldLabel - Ex: "seu nome" ou "o nome do acompanhante 1"
 * @returns {{ valid: boolean, error: string | null, sanitizedName: string }}
 */
export function validateGuestName(rawName, fieldLabel = 'o nome completo') {
  if (typeof rawName !== 'string') {
    return {
      valid: false,
      error: `Informe ${fieldLabel}.`,
      sanitizedName: '',
    };
  }

  const collapsed = rawName.replace(/\s+/g, ' ').trim();

  if (!collapsed) {
    return {
      valid: false,
      error: `Por favor, preencha ${fieldLabel}.`,
      sanitizedName: '',
    };
  }

  // 1. Bloquear números e símbolos (apenas letras e espaços)
  if (!ONLY_LETTERS_AND_SPACES_REGEX.test(collapsed)) {
    return {
      valid: false,
      error: 'Use apenas letras e espaços, sem números ou símbolos.',
      sanitizedName: collapsed,
    };
  }

  // 2. Bloquear menos de 3 letras no total
  const lettersOnly = collapsed.replace(/\s/g, '');
  if (lettersOnly.length < 3) {
    return {
      valid: false,
      error: 'O nome precisa ter pelo menos 3 letras.',
      sanitizedName: collapsed,
    };
  }

  // 3. Bloquear 3 ou mais letras iguais seguidas (ex: "aaaa", "lll")
  if (REPEATED_CHARS_REGEX.test(collapsed)) {
    return {
      valid: false,
      error: 'Evite repetir a mesma letra várias vezes seguidas.',
      sanitizedName: collapsed,
    };
  }

  // 4. Bloquear textos sem vogal (ex: "bcdfgh", "trst")
  if (!VOWEL_REGEX.test(lettersOnly)) {
    return {
      valid: false,
      error: 'Informe um nome válido contendo vogais.',
      sanitizedName: collapsed,
    };
  }

  const words = collapsed.split(' ').filter(Boolean);

  for (const word of words) {
    if (word.length >= 2 && !VOWEL_REGEX.test(word)) {
      return {
        valid: false,
        error: `A palavra "${word}" não possui vogais válidas.`,
        sanitizedName: collapsed,
      };
    }

    const normalizedWord = normalizeText(word);

    // Bloquear palavras com 4+ consoantes seguidas ou combinações de teclado aleatórias (ex: "hdahdbaj")
    if (
      /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(normalizedWord) ||
      MASHED_CONSONANT_CLUSTERS_REGEX.test(normalizedWord)
    ) {
      return {
        valid: false,
        error: `Informe um nome verdadeiro (verifique "${word}").`,
        sanitizedName: collapsed,
      };
    }
  }

  // 5. Bloquear sequências de teclado e palavras de teste ("asdf", "qwer", "teste", etc.)
  const normalizedFull = normalizeText(collapsed);
  const normalizedCompact = normalizedFull.replace(/\s/g, '');

  for (const seq of BLOCKED_SEQUENCES) {
    if (
      normalizedCompact.includes(seq) ||
      words.some((w) => normalizeText(w) === seq)
    ) {
      return {
        valid: false,
        error: 'Informe o nome real do convidado para a lista da recepção.',
        sanitizedName: collapsed,
      };
    }
  }

  // Exigir nome e sobrenome (pelo menos duas palavras, sendo o primeiro e último >= 2 letras)
  if (
    words.length < 2 ||
    words[0].length < 2 ||
    words[words.length - 1].length < 2
  ) {
    return {
      valid: false,
      error: 'Informe nome e sobrenome para identificação na portaria.',
      sanitizedName: collapsed,
    };
  }

  // Formatar com iniciais maiúsculas preservando preposições (da, de, do, dos, das, e)
  const formattedName = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && IGNORED_PREPOSITIONS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

  return {
    valid: true,
    error: null,
    sanitizedName: formattedName,
  };
}

/**
 * Extrai o primeiro nome formatado para saudação pós-confirmação.
 */
export function extractFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const first = fullName.trim().split(/\s+/)[0] || '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}
