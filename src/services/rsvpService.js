import { getDuplicatePairKey } from '../utils/validators';

const STORAGE_KEY_PREFIX = 'obza_demo_v2_rsvp_guests_';
const DISMISSED_DUPLICATES_PREFIX = 'obza_demo_v2_dismissed_duplicates_';

function getStorageKey(eventId) {
  return `${STORAGE_KEY_PREFIX}${eventId}`;
}

function getDismissedStorageKey(eventId) {
  return `${DISMISSED_DUPLICATES_PREFIX}${eventId}`;
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Gera de 10 a 12 convidados fictícios bem realistas para demonstração do painel:
 * - Mistura Adultos (8) e Crianças até 10 anos (3) (Total: 11 convidados)
 * - 3 convidados com check-in já realizado (status ativo verde)
 * - 1 par de nomes idênticos (duplicado exato): "Mariana Ferreira" confirmada duas vezes
 * - 1 par de nomes muito parecidos (possível duplicidade): "Carlos Eduardo Lima" e "Carlos Lima"
 */
function buildDemoSeedGuests(eventId) {
  const baseTime = new Date('2026-12-02T14:20:00-04:00').toISOString();
  const secondTime = new Date('2026-12-03T18:45:00-04:00').toISOString();
  const thirdTime = new Date('2026-12-04T10:15:00-04:00').toISOString();
  const fourthTime = new Date('2026-12-05T16:30:00-04:00').toISOString();
  const fifthTime = new Date('2026-12-06T11:00:00-04:00').toISOString();
  const checkInTime1 = new Date('2026-12-19T20:05:00-04:00').toISOString();
  const checkInTime2 = new Date('2026-12-19T20:12:00-04:00').toISOString();
  const checkInTime3 = new Date('2026-12-19T20:18:00-04:00').toISOString();

  const groupBeatriz = 'seed_group_beatriz';
  const groupRicardo = 'seed_group_ricardo';
  const groupMariana1 = 'seed_group_mariana_1';
  const groupMariana2 = 'seed_group_mariana_2';
  const groupCarlosEduardo = 'seed_group_carlos_eduardo';
  const groupCarlosLima = 'seed_group_carlos_lima';
  const groupJuliana = 'seed_group_juliana';

  return [
    {
      id: 'seed_guest_1',
      eventId,
      groupId: groupBeatriz,
      groupLead: 'Beatriz Cavalcante Souza',
      isLead: true,
      name: 'Beatriz Cavalcante Souza',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: true,
      checkedInAt: checkInTime1,
      confirmedAt: baseTime,
    },
    {
      id: 'seed_guest_2',
      eventId,
      groupId: groupBeatriz,
      groupLead: 'Beatriz Cavalcante Souza',
      isLead: false,
      name: 'Lucas Cavalcante Souza',
      ageGroup: 'Criança até 10 anos',
      ageCategory: 'child',
      checkedIn: true,
      checkedInAt: checkInTime2,
      confirmedAt: baseTime,
    },
    {
      id: 'seed_guest_3',
      eventId,
      groupId: groupRicardo,
      groupLead: 'Ricardo Mendes Costa',
      isLead: true,
      name: 'Ricardo Mendes Costa',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: true,
      checkedInAt: checkInTime3,
      confirmedAt: secondTime,
    },
    {
      id: 'seed_guest_4',
      eventId,
      groupId: groupRicardo,
      groupLead: 'Ricardo Mendes Costa',
      isLead: false,
      name: 'Sofia Mendes Costa',
      ageGroup: 'Criança até 10 anos',
      ageCategory: 'child',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: secondTime,
    },
    {
      id: 'seed_guest_5',
      eventId,
      groupId: groupMariana1,
      groupLead: 'Mariana Ferreira',
      isLead: true,
      name: 'Mariana Ferreira',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: thirdTime,
    },
    {
      id: 'seed_guest_6',
      eventId,
      groupId: groupMariana2,
      groupLead: 'André Luiz Ferreira',
      isLead: false,
      name: 'Mariana Ferreira',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fourthTime,
    },
    {
      id: 'seed_guest_7',
      eventId,
      groupId: groupCarlosEduardo,
      groupLead: 'Carlos Eduardo Lima',
      isLead: true,
      name: 'Carlos Eduardo Lima',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fourthTime,
    },
    {
      id: 'seed_guest_8',
      eventId,
      groupId: groupCarlosLima,
      groupLead: 'Carlos Lima',
      isLead: true,
      name: 'Carlos Lima',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fifthTime,
    },
    {
      id: 'seed_guest_9',
      eventId,
      groupId: groupJuliana,
      groupLead: 'Juliana Prado Albuquerque',
      isLead: true,
      name: 'Juliana Prado Albuquerque',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fifthTime,
    },
    {
      id: 'seed_guest_10',
      eventId,
      groupId: groupJuliana,
      groupLead: 'Juliana Prado Albuquerque',
      isLead: false,
      name: 'Felipe Prado Albuquerque',
      ageGroup: 'Adulto',
      ageCategory: 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fifthTime,
    },
    {
      id: 'seed_guest_11',
      eventId,
      groupId: groupJuliana,
      groupLead: 'Juliana Prado Albuquerque',
      isLead: false,
      name: 'Manuela Prado Albuquerque',
      ageGroup: 'Criança até 10 anos',
      ageCategory: 'child',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: fifthTime,
    },
  ];
}

/**
 * Busca a lista de pares de duplicidades dispensados ("idA|idB") para um evento.
 * @param {string} eventId
 * @returns {Promise<string[]>}
 */
export async function getDismissedDuplicatePairs(eventId) {
  if (!eventId) return [];
  try {
    const raw = localStorage.getItem(getDismissedStorageKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Dispensa o alerta de duplicidade entre um par de convidados (ou entre um convidado e todos os seus pares atuais),
 * salvando cada par ordenado "idA|idB" no localStorage por eventId.
 *
 * @param {string} eventId
 * @param {string} idA
 * @param {string | string[]} idBOrList
 * @returns {Promise<string[]>} Lista atualizada de pares dispensados
 */
export async function dismissDuplicatePair(eventId, idA, idBOrList) {
  if (!eventId || !idA || !idBOrList) return [];

  const existing = await getDismissedDuplicatePairs(eventId);
  const set = new Set(existing);

  const partnerIds = Array.isArray(idBOrList) ? idBOrList : [idBOrList];
  partnerIds.forEach((partnerId) => {
    if (partnerId && String(partnerId) !== String(idA)) {
      set.add(getDuplicatePairKey(idA, partnerId));
    }
  });

  const updated = Array.from(set);
  localStorage.setItem(
    getDismissedStorageKey(eventId),
    JSON.stringify(updated)
  );
  return updated;
}

/**
 * Busca a lista de convidados confirmados de um evento no localStorage.
 * Se `seedIfEmpty` for true e o localStorage estiver vazio, popula automaticamente
 * com os 6 convidados fictícios de exemplo.
 *
 * @param {string} eventId
 * @param {{ seedIfEmpty?: boolean }} [options]
 * @returns {Promise<Array>}
 */
export async function getGuests(eventId, options = {}) {
  if (!eventId) return [];
  const key = getStorageKey(eventId);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    if (options.seedIfEmpty) {
      const seeded = buildDemoSeedGuests(eventId);
      localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }

    return [];
  } catch (err) {
    console.error('Erro ao ler lista de convidados do localStorage:', err);
    return [];
  }
}

/**
 * Restaura os 6 convidados fictícios de demonstração para o evento
 * e limpa também os alertas de duplicidade dispensados.
 * @param {string} eventId
 * @returns {Promise<Array>}
 */
export async function resetDemoData(eventId) {
  if (!eventId) return [];
  const seeded = buildDemoSeedGuests(eventId);
  localStorage.setItem(getStorageKey(eventId), JSON.stringify(seeded));
  localStorage.removeItem(getDismissedStorageKey(eventId));
  return seeded;
}

/**
 * Salva novos convidados (titular + acompanhantes) como registros individuais
 * vinculados ao `groupLead` e com `checkedIn: false` para o Painel da Portaria.
 *
 * @param {string} eventId
 * @param {Array<{ name: string, ageGroup: string, isLead?: boolean }>} members
 * @param {{ webhookUrl?: string }} [options]
 * @returns {Promise<{ groupLead: string, groupId: string, createdRecords: Array }>}
 */
export async function addGuests(eventId, members, options = {}) {
  if (!eventId || !Array.isArray(members) || members.length === 0) {
    throw new Error('Dados de confirmação inválidos.');
  }

  const existingGuests = await getGuests(eventId, { seedIfEmpty: false });
  const nowIso = new Date().toISOString();
  const groupId = generateId();

  const leadMember = members.find((m) => m.isLead) || members[0];
  const groupLeadName = leadMember.name;

  const createdRecords = members.map((member, index) => {
    const isChild =
      member.ageGroup === 'child' ||
      String(member.ageGroup).toLowerCase().includes('criança');

    return {
      id: generateId(),
      eventId,
      groupId,
      groupLead: groupLeadName,
      isLead: index === 0 || Boolean(member.isLead),
      name: member.name,
      ageGroup: isChild ? 'Criança até 10 anos' : 'Adulto',
      ageCategory: isChild ? 'child' : 'adult',
      checkedIn: false,
      checkedInAt: null,
      confirmedAt: nowIso,
    };
  });

  const updatedList = [...existingGuests, ...createdRecords];
  localStorage.setItem(getStorageKey(eventId), JSON.stringify(updatedList));

  if (options.webhookUrl) {
    fetch(options.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        groupId,
        groupLead: groupLeadName,
        totalConfirmed: createdRecords.length,
        guests: createdRecords,
        submittedAt: nowIso,
      }),
    }).catch((err) => {
      console.warn('Webhook não pôde ser entregue:', err);
    });
  }

  return {
    groupLead: groupLeadName,
    groupId,
    createdRecords,
  };
}

/**
 * Alterna o estado de check-in de um convidado na portaria.
 * @param {string} eventId
 * @param {string} guestId
 * @param {boolean} [explicitState]
 * @returns {Promise<Array>} Lista atualizada de convidados
 */
export async function toggleCheckIn(eventId, guestId, explicitState) {
  const guests = await getGuests(eventId, { seedIfEmpty: false });
  const updated = guests.map((g) => {
    if (g.id !== guestId) return g;
    const nextState =
      typeof explicitState === 'boolean' ? explicitState : !g.checkedIn;
    return {
      ...g,
      checkedIn: nextState,
      checkedInAt: nextState ? new Date().toISOString() : null,
    };
  });
  localStorage.setItem(getStorageKey(eventId), JSON.stringify(updated));
  return updated;
}

/**
 * Alias de compatibilidade para toggleCheckIn.
 */
export const updateGuestCheckIn = toggleCheckIn;

/**
 * Remove um convidado específico da lista da portaria (ex: exclusão de duplicidade).
 * @param {string} eventId
 * @param {string} guestId
 * @returns {Promise<Array>} Lista atualizada de convidados
 */
export async function removeGuest(eventId, guestId) {
  const guests = await getGuests(eventId, { seedIfEmpty: false });
  const updated = guests.filter((g) => g.id !== guestId);
  localStorage.setItem(getStorageKey(eventId), JSON.stringify(updated));
  return updated;
}
