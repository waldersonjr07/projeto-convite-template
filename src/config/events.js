export const DEFAULT_EVENT_SLUG = 'helena-15-anos';

export const EVENTS_BY_SLUG = {
  'helena-15-anos': {
    id: 'helena-15-anos',
    slug: 'helena-15-anos',
    eventTitle: '15 Anos de Helena Mendes Cavalcante',
    honoree: 'Helena Mendes Cavalcante',
    honoreeFirstName: 'Helena',
    headlineLines: ['Helena Mendes', 'Cavalcante'],
    occasion: 'Celebrando 15 Anos',
    invitationStatement:
      'Há noites que guardam o começo de uma vida inteira. Será uma alegria receber você para celebrar meus quinze anos.',
    eventDateIso: '2026-12-19T20:00:00-04:00',
    eventDateFormatted: 'Sábado, 19 de Dezembro de 2026',
    eventTimeFormatted: 'Recepção às 20h00',
    rsvpDeadlineIso: '2026-12-15T23:59:59-04:00',
    rsvpDeadlineFormatted: '15 de Dezembro de 2026',
    venueName: 'Espaço Obza',
    venueAddress: 'Av. das Palmeiras, 1280, Jardim Europa, Cáceres - MT',
    venueCity: 'Cáceres — Mato Grosso',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=C%C3%A1ceres+MT',
    specialNoteTitle: 'Orientação de Traje',
    specialNote: 'Traje Esporte Fino',
    specialNoteDescription:
      'Pedimos traje esporte fino para compor a harmonia da noite no salão.',
    footerReception: 'Recepção • Espaço Obza',
    authorName: 'Feito por Obza',
    authorUrl: 'https://obza.com.br',
    panelPassword: 'Obza123',
    webhookUrl: '',
    maxCompanions: 5,
    palette: {
      bgMain: '#1D2418',
      surface: '#283121',
      surfaceElevated: '#34402B',
      textPrimary: '#F2ECE1',
      textMuted: '#C2BBA8',
      accent: '#C9A97E',
      accentInk: '#1D2418',
      sage: '#7A8B6E',
      confetti: ['#7A8B6E', '#C9A97E', '#F2ECE1'],
    },
  },
};

/**
 * Busca um evento pelo slug, retornando o evento padrão caso não especificado
 * ou null se um slug inválido for passado na URL.
 */
export function getEventBySlug(slug) {
  if (!slug) {
    return EVENTS_BY_SLUG[DEFAULT_EVENT_SLUG];
  }
  return EVENTS_BY_SLUG[slug] || null;
}

/**
 * Converte a paleta do evento em variáveis CSS inline para aplicar no container raiz.
 */
export function getEventCssVariables(event) {
  const palette = event?.palette || EVENTS_BY_SLUG[DEFAULT_EVENT_SLUG].palette;
  return {
    '--bg-main': palette.bgMain,
    '--surface': palette.surface,
    '--surface-elevated': palette.surfaceElevated,
    '--text-primary': palette.textPrimary,
    '--text-muted': palette.textMuted,
    '--accent': palette.accent,
    '--accent-ink': palette.accentInk,
    '--sage': palette.sage,
  };
}
