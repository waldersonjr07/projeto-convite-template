import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEventBySlug,
  DEFAULT_EVENT_SLUG,
} from '../config/events';
import {
  getGuests,
  toggleCheckIn,
  removeGuest,
  resetDemoData,
  getDismissedDuplicatePairs,
  dismissDuplicatePair,
} from '../services/rsvpService';
import {
  normalizeForComparison,
  compareGuestNames,
  getDuplicatePairKey,
} from '../utils/validators';

const AUTH_SESSION_PREFIX = 'espaco_five_panel_auth_';

/**
 * Ícone minimalista e geométrico flat de coroa na cor dourado champanhe.
 */
export function CrownIcon({ className = 'w-5 h-5 text-[#C9A45C]' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <path d="M2 19h20v2H2v-2zm1.8-12.5l3.8 3.5 4.4-6 4.4 6 3.8-3.5L20 17H4L3.8 6.5z" />
    </svg>
  );
}

/**
 * Ícone SVG minimalista de olho (aberto / cortado) para mostrar ou ocultar senha.
 */
function EyeIcon({ isVisible, className = 'w-5 h-5' }) {
  if (isVisible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={className}
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 002.84 2.84" />
        <path d="M9.88 5.08A10.43 10.43 0 0112 5c6.5 0 10 7 10 7a14.66 14.66 0 01-3.38 4.47" />
        <path d="M6.61 6.61A14.22 14.22 0 002 12s3.5 7 10 7a9.78 9.78 0 005.39-1.61" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getOriginLabel(guest) {
  const normName = normalizeForComparison(guest.name);
  const normLead = normalizeForComparison(guest.groupLead);
  if (guest.isLead || !guest.groupLead || normName === normLead) {
    return 'Confirmação própria';
  }
  return `Confirmado por ${guest.groupLead}`;
}

function isChildGuest(guest) {
  return (
    guest.ageCategory === 'child' ||
    String(guest.ageGroup).toLowerCase().includes('criança')
  );
}

export default function PanelPage() {
  const { slug } = useParams();
  const event = getEventBySlug(slug || DEFAULT_EVENT_SLUG);

  const authStorageKey = event
    ? `${AUTH_SESSION_PREFIX}${event.id}`
    : `${AUTH_SESSION_PREFIX}default`;

  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(authStorageKey) === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [guests, setGuests] = useState([]);
  const [dismissedPairs, setDismissedPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'adults' | 'children' | 'duplicates'
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [confirmResetDemo, setConfirmResetDemo] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const [showDuplicateWarningModal, setShowDuplicateWarningModal] = useState(false);

  useEffect(() => {
    try {
      setIsUnlocked(sessionStorage.getItem(authStorageKey) === 'true');
    } catch {
      setIsUnlocked(false);
    }
  }, [authStorageKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-main', '#141413');
    root.style.setProperty('--text-primary', '#F5F3EE');
    if (event) {
      document.title = `Portaria • ${event.eventTitle || event.honoree} • ${event.venueName}`;
    }
  }, [event]);

  useEffect(() => {
    if (!event || !isUnlocked) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getGuests(event.id, { seedIfEmpty: true }),
      getDismissedDuplicatePairs(event.id),
    ])
      .then(([list, dismissed]) => {
        if (isMounted) {
          setGuests(list);
          setDismissedPairs(dismissed);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [event, isUnlocked]);

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    const expectedPassword = event?.panelPassword || 'Espaco5';
    if (passwordInput.trim() === expectedPassword) {
      try {
        sessionStorage.setItem(authStorageKey, 'true');
      } catch {
        // Ignorar erro de sessionStorage em modo restrito
      }
      setIsUnlocked(true);
      setPasswordInput('');
      setShowPassword(false);
      setAuthError('');
    } else {
      setAuthError('Senha incorreta. Verifique com a administração do Espaço Five.');
    }
  };

  const handleLockPanel = () => {
    try {
      sessionStorage.removeItem(authStorageKey);
    } catch {
      // Ignorar
    }
    setIsUnlocked(false);
    setPasswordInput('');
    setShowPassword(false);
    setAuthError('');
  };

  const handleToggleCheckIn = async (guestId) => {
    if (!event) return;
    const updated = await toggleCheckIn(event.id, guestId);
    setGuests(updated);
  };

  const handleConfirmRemoveGuest = async (guestId) => {
    if (!event) return;
    const updated = await removeGuest(event.id, guestId);
    setGuests(updated);
    setPendingDeleteId(null);
  };

  const handleDismissDuplicate = async (guest) => {
    if (!event || !guest?.duplicatePartnerIds?.length) return;
    const updatedDismissed = await dismissDuplicatePair(
      event.id,
      guest.id,
      guest.duplicatePartnerIds
    );
    setDismissedPairs(updatedDismissed);
  };

  const handleResetDemo = async () => {
    if (!event) return;
    const seeded = await resetDemoData(event.id);
    setGuests(seeded);
    setDismissedPairs([]);
    setConfirmResetDemo(false);
    setPendingDeleteId(null);
    setFeedbackNotice('Dados demonstrativos restaurados com sucesso.');
    setTimeout(() => {
      setFeedbackNotice('');
    }, 3500);
  };

  // Análise de duplicidade inteligente em 2 níveis ('exact' e 'probable'),
  // respeitando os pares já dispensados pela equipe ("Não é duplicado").
  const duplicateAnalysisById = useMemo(() => {
    const dismissedSet = new Set(dismissedPairs);
    const analysisMap = new Map();

    guests.forEach((g) => {
      analysisMap.set(g.id, {
        level: null, // 'exact' | 'probable' | null
        partnerIds: [],
      });
    });

    for (let i = 0; i < guests.length; i += 1) {
      for (let j = i + 1; j < guests.length; j += 1) {
        const guestA = guests[i];
        const guestB = guests[j];
        const pairKey = getDuplicatePairKey(guestA.id, guestB.id);

        if (dismissedSet.has(pairKey)) {
          continue;
        }

        const matchLevel = compareGuestNames(guestA.name, guestB.name);
        if (!matchLevel) continue;

        const entryA = analysisMap.get(guestA.id);
        const entryB = analysisMap.get(guestB.id);

        entryA.partnerIds.push(guestB.id);
        entryB.partnerIds.push(guestA.id);

        // 'exact' tem precedência sobre 'probable'
        if (entryA.level !== 'exact') {
          entryA.level = matchLevel;
        }
        if (entryB.level !== 'exact') {
          entryB.level = matchLevel;
        }
      }
    }

    return analysisMap;
  }, [guests, dismissedPairs]);

  // Lista enriquecida e sempre ordenada de A a Z
  const sortedGuests = useMemo(() => {
    return [...guests]
      .map((guest) => {
        const dupInfo = duplicateAnalysisById.get(guest.id) || {
          level: null,
          partnerIds: [],
        };
        const isChild = isChildGuest(guest);
        const originLabel = getOriginLabel(guest);

        let duplicateBadgeLabel = null;
        if (dupInfo.level === 'exact') {
          duplicateBadgeLabel = 'Nome Duplicado';
        } else if (dupInfo.level === 'probable') {
          duplicateBadgeLabel = 'Possível Duplicado';
        }

        return {
          ...guest,
          isChild,
          ageBadge: isChild ? 'Criança' : 'Adulto',
          originLabel,
          isDuplicate: Boolean(dupInfo.level),
          duplicateLevel: dupInfo.level,
          duplicateBadgeLabel,
          duplicatePartnerIds: dupInfo.partnerIds,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [guests, duplicateAnalysisById]);

  // Indicadores do Placar em Tempo Real
  const stats = useMemo(() => {
    const total = sortedGuests.length;
    const children = sortedGuests.filter((g) => g.isChild).length;
    const adults = total - children;
    const checkedIn = sortedGuests.filter((g) => g.checkedIn).length;
    const duplicateEntries = sortedGuests.filter((g) => g.isDuplicate);
    const uniqueDuplicateNames = Array.from(
      new Set(duplicateEntries.map((g) => g.name))
    );

    return {
      total,
      adults,
      children,
      checkedIn,
      duplicateRecordsCount: duplicateEntries.length,
      uniqueDuplicateNames,
    };
  }, [sortedGuests]);

  const handlePrintRequest = () => {
    if (stats.duplicateRecordsCount > 0) {
      setShowDuplicateWarningModal(true);
    } else {
      window.print();
    }
  };

  const handleReviewDuplicatesFromModal = () => {
    setShowDuplicateWarningModal(false);
    setActiveFilter('duplicates');
    setTimeout(() => {
      const headingEl = document.getElementById('guest-list-heading');
      if (headingEl) {
        headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handlePrintAnywayFromModal = () => {
    setShowDuplicateWarningModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Lista filtrada pela busca instantânea e pelo botão de filtro ativo
  const filteredGuests = useMemo(() => {
    const normalizedQuery = normalizeForComparison(searchQuery);

    return sortedGuests.filter((guest) => {
      if (activeFilter === 'adults' && guest.isChild) return false;
      if (activeFilter === 'children' && !guest.isChild) return false;
      if (activeFilter === 'duplicates' && !guest.isDuplicate) return false;

      if (!normalizedQuery) return true;

      const matchName = normalizeForComparison(guest.name).includes(
        normalizedQuery
      );
      const matchLead = normalizeForComparison(guest.groupLead).includes(
        normalizedQuery
      );
      const matchOrigin = normalizeForComparison(guest.originLabel).includes(
        normalizedQuery
      );

      return matchName || matchLead || matchOrigin;
    });
  }, [sortedGuests, activeFilter, searchQuery]);

  if (!event) {
    return (
      <main className="min-h-screen bg-[#141413] text-[#F5F3EE] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-[#1E1E1C] p-8 sm:p-10">
          <h1 className="font-solid text-3xl font-bold text-[#F5F3EE] leading-tight mb-4">
            Evento não encontrado
          </h1>
          <p className="text-base text-[#9E9B93] leading-relaxed mb-8">
            Não encontramos um painel de portaria para o identificador informado.
          </p>
          <Link
            to={`/painel/${DEFAULT_EVENT_SLUG}`}
            className="inline-flex items-center justify-center w-full px-6 py-4 bg-[#C9A45C] text-[#141413] font-semibold text-base"
          >
            Abrir Painel Demonstrativo
          </Link>
        </div>
      </main>
    );
  }

  // Tela de Bloqueio com Senha Fixa e Botão Mostrar/Ocultar Senha (Olhinho)
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#141413] text-[#F5F3EE] font-sans flex flex-col justify-between px-5 py-10 sm:px-8">
        <div className="max-w-md w-full mx-auto my-auto">
          <div className="bg-[#1E1E1C] p-7 sm:p-10">
            <div className="flex items-center gap-2 mb-3">
              <CrownIcon className="w-5 h-5 text-[#C9A45C]" />
              <p className="text-sm font-semibold text-[#C9A45C]">
                {event.venueName} • Portaria
              </p>
            </div>

            <h1 className="font-solid text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight leading-tight mb-3">
              {event.eventTitle || `15 Anos de ${event.honoree}`}
            </h1>

            <p className="text-sm text-[#9E9B93] leading-relaxed mb-8">
              Acesso restrito à equipe de recepção e cerimonial. Digite a senha operacional do buffet para abrir a lista de convidados.
            </p>

            <form onSubmit={handleUnlockSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="panel-password"
                  className="block text-sm font-semibold text-[#F5F3EE] mb-2"
                >
                  Senha do Painel
                </label>
                <div className="relative">
                  <input
                    id="panel-password"
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Digite a senha do buffet"
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? 'panel-auth-error' : undefined}
                    className="w-full bg-[#282825] text-[#F5F3EE] placeholder:text-[#9E9B93]/60 pl-4 pr-12 py-3.5 text-base focus:outline focus:outline-2 focus:outline-[#C9A45C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-[#9E9B93] hover:text-[#F5F3EE] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A45C]"
                  >
                    <EyeIcon isVisible={showPassword} className="w-5 h-5" />
                  </button>
                </div>
                {authError && (
                  <p
                    id="panel-auth-error"
                    role="alert"
                    className="mt-2 text-sm font-medium text-[#E2956B]"
                  >
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-[#C9A45C] text-[#141413] font-semibold text-base transition-transform duration-150 active:scale-[0.99] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C]"
              >
                Acessar Lista da Portaria
              </button>
            </form>
          </div>
        </div>

        <footer className="max-w-md w-full mx-auto pt-8 flex items-center justify-between text-xs text-[#9E9B93]">
          <span className="flex items-center gap-1.5">
            <CrownIcon className="w-3.5 h-3.5 text-[#C9A45C]" />
            {event.venueName}
          </span>
          <a
            href={event.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F5F3EE] transition-colors"
          >
            {event.authorName}
          </a>
        </footer>
      </main>
    );
  }

  const filterButtons = [
    { id: 'all', label: 'Todos', count: stats.total },
    { id: 'adults', label: 'Adultos', count: stats.adults },
    { id: 'children', label: 'Crianças', count: stats.children },
    { id: 'duplicates', label: 'Duplicados', count: stats.duplicateRecordsCount },
  ];

  return (
    <div
      data-ui="true"
      className="panel-print-root min-h-screen bg-[#141413] text-[#F5F3EE] font-sans selection:bg-[#C9A45C] selection:text-[#141413]"
    >
      {/* =====================================================================
          INTERFACE OPERACIONAL EM TELA (Oculta na impressão A4 via .no-print)
         ===================================================================== */}
      <div className="no-print">
        {/* Cabeçalho Operacional com Ícone da Coroa e Tipografia Sólida */}
        <header className="bg-[#1E1E1C]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#C9A45C]">
                    <CrownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9A45C]" />
                    <span>{event.venueName} • Controle de Portaria</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-[#2E2A21] text-[#E5C98B] font-medium">
                    Recepção Oficial
                  </span>
                </div>

                <h1 className="font-solid text-2xl sm:text-4xl lg:text-5xl font-bold text-[#F5F3EE] leading-[1.08] tracking-tight">
                  {event.eventTitle || `15 Anos de ${event.honoree}`}
                </h1>

                <p className="mt-2.5 text-sm sm:text-base text-[#9E9B93]">
                  {event.eventDateFormatted} • {event.eventTimeFormatted} • {event.venueAddress}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0">
                <button
                  type="button"
                  onClick={handlePrintRequest}
                  className="flex-1 sm:flex-initial px-6 py-3.5 bg-[#C9A45C] text-[#141413] font-semibold text-sm sm:text-base transition-transform duration-150 active:scale-[0.98] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C]"
                >
                  Imprimir Lista da Portaria
                </button>

                <button
                  type="button"
                  onClick={handleLockPanel}
                  className="px-4 py-3.5 bg-[#343430] text-[#F5F3EE] font-medium text-sm sm:text-base transition-colors hover:bg-[#282825] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C]"
                >
                  Sair / Bloquear
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-8">
          {/* 1. Placar em Tempo Real com Tipografia Sólida e Números Tabulares */}
          <section aria-label="Placar de convidados em tempo real">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-[#1E1E1C] p-5 sm:p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-[#9E9B93]">
                  Total Confirmados
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-solid text-4xl sm:text-5xl font-bold text-[#F5F3EE] tabular-nums leading-none tracking-tight">
                    {stats.total}
                  </span>
                  <span className="text-xs text-[#9E9B93]">na lista</span>
                </div>
              </div>

              <div className="bg-[#1E1E1C] p-5 sm:p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-[#9E9B93]">
                  Adultos
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-solid text-4xl sm:text-5xl font-bold text-[#F5F3EE] tabular-nums leading-none tracking-tight">
                    {stats.adults}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-[#282825] text-[#9E9B93]">
                    Integral
                  </span>
                </div>
              </div>

              <div className="bg-[#1E1E1C] p-5 sm:p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-[#9E9B93]">
                  Crianças (até 10 anos)
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-solid text-4xl sm:text-5xl font-bold text-[#F5F3EE] tabular-nums leading-none tracking-tight">
                    {stats.children}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-[#282825] text-[#9E9B93]">
                    Infantil
                  </span>
                </div>
              </div>

              <div className="bg-[#282825] p-5 sm:p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-[#E5C98B]">
                  Check-ins realizados
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-solid text-4xl sm:text-5xl font-bold text-[#E5C98B] tabular-nums leading-none tracking-tight">
                    {stats.checkedIn}
                  </span>
                  <span className="text-xs text-[#9E9B93] tabular-nums">
                    faltam {Math.max(0, stats.total - stats.checkedIn)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Banner de Alerta Automático de Duplicidades (Terracota / Âmbar Fosco) */}
          {stats.duplicateRecordsCount > 0 && (
            <section
              aria-label="Alerta de duplicidades na lista"
              role="alert"
              className="bg-[#291E1A] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 bg-[#D9825B]"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-semibold text-[#F5F3EE]">
                    {stats.duplicateRecordsCount} registros com nome duplicado ou similar detectados
                  </h2>
                </div>
                <p className="text-sm text-[#D6C5BC] leading-relaxed">
                  Nomes em revisão:{' '}
                  <strong className="font-semibold text-[#E89B74]">
                    {stats.uniqueDuplicateNames.join(', ')}
                  </strong>
                  . Compare quem confirmou cada registro, remova a sobra ou marque como não duplicado caso sejam pessoas distintas.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveFilter((prev) =>
                    prev === 'duplicates' ? 'all' : 'duplicates'
                  )
                }
                className="shrink-0 px-5 py-3 bg-[#3A2822] text-[#F2B391] font-semibold text-sm transition-colors hover:bg-[#4A322A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E89B74]"
              >
                {activeFilter === 'duplicates'
                  ? 'Mostrar Todos os Convidados'
                  : `Filtrar Duplicados (${stats.duplicateRecordsCount})`}
              </button>
            </section>
          )}

          {/* 3. Barra de Busca Instantânea e Filtros Rápidos */}
          <section
            aria-label="Busca e filtros da lista"
            className="bg-[#1E1E1C] p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <label htmlFor="guest-search" className="sr-only">
                  Buscar por nome do convidado ou responsável pela confirmação
                </label>
                <input
                  id="guest-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar convidado ou quem confirmou (ex: Gabriel, Beatriz)..."
                  className="w-full bg-[#282825] text-[#F5F3EE] placeholder:text-[#9E9B93] px-4 py-3.5 text-base focus:outline focus:outline-2 focus:outline-[#C9A45C]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#343430] text-xs text-[#F5F3EE] hover:opacity-90"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtros por categoria"
              >
                {filterButtons.map((btn) => {
                  const isActive = activeFilter === btn.id;
                  const isDuplicateBtn = btn.id === 'duplicates';
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setActiveFilter(btn.id)}
                      className={`px-4 py-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C] ${
                        isActive
                          ? 'bg-[#C9A45C] text-[#141413]'
                          : isDuplicateBtn && btn.count > 0
                          ? 'bg-[#3A2822] text-[#F2B391] hover:bg-[#4A322A]'
                          : 'bg-[#343430] text-[#F5F3EE] hover:bg-[#282825]'
                      }`}
                    >
                      {btn.label} ({btn.count})
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Aviso de feedback ao restaurar dados de exemplo */}
          {feedbackNotice && (
            <div
              role="status"
              className="bg-[#2E2A21] text-[#E5C98B] px-5 py-3.5 text-sm font-medium"
            >
              {feedbackNotice}
            </div>
          )}

          {/* 4. Lista Alfabética da Portaria (A a Z) */}
          <section aria-labelledby="guest-list-heading" className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2
                id="guest-list-heading"
                className="font-solid text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight"
              >
                Lista Alfabética da Portaria (A a Z)
              </h2>
              <span className="text-sm text-[#9E9B93] tabular-nums">
                Exibindo {filteredGuests.length} de {stats.total}
              </span>
            </div>

            {isLoading ? (
              <div className="bg-[#1E1E1C] p-10 text-center text-[#9E9B93]">
                Carregando lista da portaria...
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="bg-[#1E1E1C] p-10 text-center space-y-4">
                <p className="text-base text-[#F5F3EE] font-medium">
                  Nenhum convidado encontrado com os filtros atuais.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {(searchQuery || activeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                      className="px-5 py-3 bg-[#343430] text-[#F5F3EE] text-sm font-semibold hover:bg-[#282825]"
                    >
                      Limpar busca e filtros
                    </button>
                  )}
                  {stats.total === 0 && (
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="px-5 py-3 bg-[#C9A45C] text-[#141413] text-sm font-semibold"
                    >
                      Carregar dados de exemplo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Convidados confirmados">
                {filteredGuests.map((guest) => {
                  const isConfirmingDelete = pendingDeleteId === guest.id;

                  return (
                    <li
                      key={guest.id}
                      className={`p-5 sm:p-6 transition-colors ${
                        guest.isDuplicate
                          ? 'bg-[#251C18]'
                          : guest.checkedIn
                          ? 'bg-[#1A1A18]'
                          : 'bg-[#1E1E1C]'
                      }`}
                    >
                      {/* Layout Mobile-First: No celular os botões empilham abaixo do nome confortavelmente */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        {/* Informações do convidado: largura total no celular sem espremer */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-base sm:text-lg font-semibold break-words transition-colors ${
                                guest.checkedIn
                                  ? 'line-through text-[#9E9B93]'
                                  : 'text-[#F5F3EE]'
                              }`}
                            >
                              {guest.name}
                            </span>

                            {/* Badge de Faixa Etária */}
                            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-[#2E2A21] text-[#E5C98B]">
                              {guest.ageBadge}
                            </span>

                            {/* Badge de Check-in Concluído */}
                            {guest.checkedIn && (
                              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-[#2E2A21] text-[#E5C98B]">
                                Presente
                              </span>
                            )}

                            {/* Destaque de Duplicidade em 2 níveis ("Nome Duplicado" ou "Possível Duplicado") */}
                            {guest.isDuplicate && guest.duplicateBadgeLabel && (
                              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-[#3D2821] text-[#F2B391]">
                                {guest.duplicateBadgeLabel}
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-[#9E9B93]">
                            {guest.originLabel}
                          </p>
                        </div>

                        {/* Controles Operacionais: Check-in, Não é duplicado e Remover */}
                        <div className="flex flex-wrap items-center gap-2 pt-2.5 sm:pt-0 border-t border-[#282825] sm:border-0 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleToggleCheckIn(guest.id)}
                            aria-pressed={guest.checkedIn}
                            className={`flex-1 sm:flex-initial text-center px-4 py-3 sm:px-5 sm:py-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C] ${
                              guest.checkedIn
                                ? 'bg-[#2E2A21] text-[#E5C98B] hover:opacity-90'
                                : 'bg-[#343430] text-[#F5F3EE] hover:bg-[#C9A45C] hover:text-[#141413]'
                            }`}
                          >
                            {guest.checkedIn ? 'Check-in Feito ✓' : 'Check-in'}
                          </button>

                          {guest.isDuplicate && (
                            <button
                              type="button"
                              onClick={() => handleDismissDuplicate(guest)}
                              className="px-3.5 py-3 text-sm font-medium bg-[#3A2822] text-[#F2B391] hover:bg-[#4A322A] hover:text-[#F5F3EE] transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E89B74]"
                              aria-label={`Dispensar alerta de duplicidade para ${guest.name}`}
                            >
                              Não é duplicado
                            </button>
                          )}

                          {!isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(guest.id)}
                              className="px-4 py-3 text-sm font-medium bg-[#282825] text-[#9E9B93] hover:text-[#F5F3EE] hover:bg-[#343430] transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A45C]"
                              aria-label={`Remover ${guest.name} da lista`}
                            >
                              Remover
                            </button>
                          ) : (
                            <div
                              className="flex items-center gap-1.5 bg-[#291E1A] p-1 shrink-0"
                              role="group"
                              aria-label={`Confirmar remoção de ${guest.name}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfirmRemoveGuest(guest.id)
                                }
                                className="px-3 py-2 text-xs font-semibold bg-[#A84A32] text-[#F5F3EE] hover:opacity-95"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(null)}
                                className="px-2.5 py-2 text-xs font-medium bg-[#343430] text-[#F5F3EE]"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>

        {/* Rodapé Operacional com Restauração de Dados de Exemplo e Assinatura */}
        <footer className="mt-14 bg-[#1E1E1C] py-8">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {!confirmResetDemo ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetDemo(true)}
                  className="text-xs sm:text-sm text-[#9E9B93] hover:text-[#F5F3EE] bg-[#282825] px-4 py-2.5 transition-colors"
                >
                  Restaurar dados de exemplo
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 bg-[#282825] p-2">
                  <span className="text-xs text-[#F5F3EE] px-2">
                    Substituir lista atual pelos 6 convidados de exemplo?
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#C9A45C] text-[#141413]"
                  >
                    Sim, restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetDemo(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-[#343430] text-[#F5F3EE]"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <Link
                to={`/convite/${event.slug}`}
                className="text-xs sm:text-sm text-[#9E9B93] hover:text-[#C9A45C] transition-colors"
              >
                Ver página do convite
              </Link>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-xs sm:text-sm text-[#9E9B93]">
              <span className="flex items-center gap-1.5">
                <CrownIcon className="w-3.5 h-3.5 text-[#C9A45C]" />
                {event.venueName}
              </span>
              <a
                href={event.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F5F3EE] transition-colors"
              >
                {event.authorName}
              </a>
            </div>
          </div>
        </footer>

        {/* Modal de Trava de Segurança contra Impressão com Duplicidades */}
        {showDuplicateWarningModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 print:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
          >
            <div className="bg-[#1E1E1C] max-w-md w-full p-6 sm:p-8 space-y-5 text-left">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 bg-[#D9825B] shrink-0"
                  aria-hidden="true"
                />
                <h3
                  id="duplicate-modal-title"
                  className="font-solid text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight"
                >
                  Nomes duplicados na lista
                </h3>
              </div>

              <p className="text-sm text-[#D6C5BC] leading-relaxed">
                Ainda existem{' '}
                <strong className="font-semibold text-[#F2B391]">
                  {stats.duplicateRecordsCount} registros
                </strong>{' '}
                com nome repetido ({stats.uniqueDuplicateNames.join(', ')}). Deseja revisar antes de imprimir a folha da portaria?
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={handleReviewDuplicatesFromModal}
                  className="flex-1 py-3.5 px-5 bg-[#C9A45C] text-[#141413] font-semibold text-sm transition-transform duration-150 active:scale-[0.98] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C]"
                >
                  Revisar duplicados
                </button>
                <button
                  type="button"
                  onClick={handlePrintAnywayFromModal}
                  className="py-3.5 px-5 bg-[#343430] text-[#F5F3EE] font-medium text-sm transition-colors hover:bg-[#282825] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A45C]"
                >
                  Imprimir mesmo assim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FOLHA A4 DE IMPRESSÃO DA PORTARIA (Exibida exclusivamente no @media print)
          Sem endereço, sem cabeçalhos/rodapés de navegador (@page margin 0 + padding 16mm)
         ===================================================================== */}
      <div className="only-print hidden bg-white text-[#111111] font-sans">
        <div className="pb-5 mb-6 border-b-2 border-[#111111]">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <CrownIcon className="w-4 h-4 text-[#111111]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                {event.venueName} • Lista Oficial da Portaria
              </span>
            </div>
            <span className="text-xs font-medium text-[#333333]">
              Ordem Alfabética (A a Z)
            </span>
          </div>

          <h1 className="font-solid text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
            {event.eventTitle || `15 Anos de ${event.honoree}`}
          </h1>

          <p className="text-xs font-medium text-[#333333] mt-1">
            {event.eventDateFormatted} • {event.eventTimeFormatted}
          </p>

          <div className="mt-4 flex items-center gap-8 text-xs font-bold text-[#111111] tabular-nums">
            <span>Total Confirmados: {stats.total}</span>
            <span>Adultos: {stats.adults}</span>
            <span>Crianças (até 10 anos): {stats.children}</span>
          </div>
        </div>

        <table className="w-full border-collapse text-left text-sm text-[#111111]">
          <thead>
            <tr className="border-b border-[#111111] text-xs font-bold">
              <th className="py-2 pr-3 w-16">Entrada</th>
              <th className="py-2 pr-4">Nome do Convidado</th>
              <th className="py-2 pr-4 w-28">Categoria</th>
              <th className="py-2">Origem da Confirmação</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((guest) => (
              <tr
                key={guest.id}
                className="print-row border-b border-[#CCCCCC]"
              >
                <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                  [ &nbsp;&nbsp;&nbsp; ]
                </td>
                <td className="py-2.5 pr-4 font-semibold text-[#111111]">
                  {guest.name}
                </td>
                <td className="py-2.5 pr-4 text-xs text-[#222222]">
                  {guest.ageBadge}
                </td>
                <td className="py-2.5 text-xs text-[#333333]">
                  {guest.originLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
