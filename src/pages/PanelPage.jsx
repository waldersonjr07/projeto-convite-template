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
import { ObzaIcon, ObzaWordmark, ObzaBrand } from '../components/ObzaBrand';

const AUTH_SESSION_PREFIX = 'obza_panel_auth_';

export { ObzaIcon, ObzaWordmark, ObzaBrand };

/**
 * Ícone SVG minimalista de olho (aberto / cortado) para mostrar ou ocultar senha.
 */
function EyeIcon({ isVisible, className = 'w-4 h-4' }) {
  if (isVisible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.2" y2="16.2" />
    </svg>
  );
}

function PrinterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" />
    </svg>
  );
}

function LockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CircleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function AlertIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
    root.style.setProperty('--bg-main', '#08090A');
    root.style.setProperty('--text-primary', '#F7F8F8');
    document.title = 'Obza | Painel da Portaria';
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
    const expectedPassword = event?.panelPassword || 'Obza123';
    if (passwordInput.trim().toLowerCase() === expectedPassword.toLowerCase()) {
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
      setAuthError('Senha incorreta. Verifique com a administração.');
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
    const checkInPercentage =
      total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return {
      total,
      adults,
      children,
      checkedIn,
      checkInPercentage,
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
      <main className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex items-center justify-center px-6 py-16 font-sans font-normal">
        <div className="max-w-md w-full bg-[#111214] border border-[#1F2125] rounded-xl p-7 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-medium text-[#F7F8F8] tracking-[-0.03em] leading-tight mb-3">
            Evento não encontrado
          </h1>
          <p className="text-[13.5px] text-[#8A8F98] font-normal leading-relaxed mb-6">
            Não encontramos um painel de portaria para o identificador informado.
          </p>
          <Link
            to={`/painel/${DEFAULT_EVENT_SLUG}`}
            className="inline-flex items-center justify-center w-full h-9 px-4 bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] hover:border-[#434854] text-[#F7F8F8] font-medium text-[13.5px] rounded-lg transition-colors duration-100"
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
      <main className="min-h-screen bg-[#08090A] text-[#F7F8F8] font-sans font-normal flex flex-col justify-between px-5 py-10 sm:px-8">
        <div className="max-w-sm w-full mx-auto my-auto">
          <div className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-6 sm:p-8 transition-colors duration-100">
            <div className="flex items-center gap-2.5 mb-4">
              <ObzaBrand
                iconClassName="w-4 h-4 text-[#FFFFFF]"
                wordmarkClassName="h-3.5 w-auto text-[#FFFFFF]"
                className="inline-flex items-center gap-2 text-[#FFFFFF]"
              />
              <span className="text-[12px] px-2 py-0.5 bg-[#16181C] text-[#8A8F98] border border-[#23262C] rounded-md font-normal ml-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Painel da Portaria
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-medium text-[#F7F8F8] tracking-[-0.03em] leading-tight mb-2">
              {event.eventTitle || `15 Anos de ${event.honoree}`}
            </h1>

            <p className="text-[13px] text-[#8A8F98] font-normal leading-relaxed mb-6">
              Acesso restrito à equipe de recepção e cerimonial. Digite a senha operacional para abrir a lista de convidados.
            </p>

            <form onSubmit={handleUnlockSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="panel-password"
                  className="block text-[13px] font-medium text-[#F7F8F8] mb-1.5"
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
                    placeholder="Digite a senha operacional"
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? 'panel-auth-error' : undefined}
                    className="w-full h-9 bg-[#08090A] border border-[#1F2125] hover:border-[#2E3138] rounded-lg text-[#F7F8F8] placeholder:text-[#8A8F98]/60 pl-3 pr-10 text-[13.5px] font-normal focus:bg-[#111214] focus:outline-none focus:border-[#434854] transition-colors duration-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#8A8F98] hover:text-[#F7F8F8] rounded-md transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#434854]"
                  >
                    <EyeIcon isVisible={showPassword} className="w-4 h-4" />
                  </button>
                </div>
                {authError && (
                  <p
                    id="panel-auth-error"
                    role="alert"
                    className="mt-1.5 text-[12.5px] font-medium text-red-400"
                  >
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-9 px-4 bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] hover:border-[#434854] text-[#F7F8F8] font-medium text-[13.5px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#434854]"
              >
                Acessar Lista da Portaria
              </button>
            </form>
          </div>
        </div>

        <footer className="max-w-sm w-full mx-auto pt-8 flex items-center justify-between text-[12px] text-[#8A8F98]">
          <a
            href={event.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#8A8F98] hover:text-[#FFFFFF] transition-colors duration-100"
          >
            <span>Feito por</span>
            <ObzaWordmark className="h-2.5 w-auto text-[#F7F8F8] inline-block" />
          </a>
          <span className="text-[11.5px] text-[#8A8F98]/80">Acesso Operacional</span>
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
      className="panel-print-root min-h-screen bg-[#08090A] text-[#F7F8F8] font-sans font-normal selection:bg-[#2E3138] selection:text-[#F7F8F8]"
    >
      {/* =====================================================================
          INTERFACE OPERACIONAL EM TELA (Oculta na impressão A4 via .no-print)
         ===================================================================== */}
      <div className="no-print">
        {/* Cabeçalho Operacional com Branding Obza (Densidade Linear) */}
        <header className="bg-[#111214] border-b border-[#1F2125]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <ObzaBrand
                    iconClassName="w-4 h-4 text-[#FFFFFF]"
                    wordmarkClassName="h-3.5 w-auto text-[#FFFFFF]"
                    className="inline-flex items-center gap-2 text-[#FFFFFF]"
                  />
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-medium text-[#F7F8F8] leading-tight tracking-[-0.03em]">
                  {event.eventTitle || `15 Anos de ${event.honoree}`}
                </h1>

                <p className="mt-1 text-[13px] text-[#8A8F98] font-normal">
                  {event.eventDateFormatted} • {event.eventTimeFormatted}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 md:justify-end shrink-0">
                <button
                  type="button"
                  onClick={handlePrintRequest}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] hover:border-[#434854] text-[#F7F8F8] font-medium text-[13px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#434854]"
                >
                  <PrinterIcon className="w-4 h-4 text-[#8A8F98]" />
                  <span>Imprimir Lista da Portaria</span>
                </button>

                <button
                  type="button"
                  onClick={handleLockPanel}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] hover:bg-[#16181C] text-[#8A8F98] hover:text-[#F7F8F8] font-normal text-[13px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#434854]"
                >
                  <LockIcon className="w-4 h-4 text-[#8A8F98]" />
                  <span>Sair / Bloquear</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-6 space-y-5">
          {/* 1. Placar em Tempo Real (KPIs compactos padrão Linear) */}
          <section aria-label="Placar de convidados em tempo real">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-4 flex flex-col justify-between transition-colors duration-100">
                <span className="text-[12.5px] font-normal text-[#8A8F98]">
                  Total Confirmados
                </span>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-medium text-[#F7F8F8] tabular-nums leading-none tracking-[-0.03em]">
                    {stats.total}
                  </span>
                  <span className="text-[12px] text-[#8A8F98]">na lista</span>
                </div>
              </div>

              <div className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-4 flex flex-col justify-between transition-colors duration-100">
                <span className="text-[12.5px] font-normal text-[#8A8F98]">
                  Adultos
                </span>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-medium text-[#F7F8F8] tabular-nums leading-none tracking-[-0.03em]">
                    {stats.adults}
                  </span>
                  <span className="text-[11.5px] px-1.5 py-0.5 bg-[#16181C] text-[#8A8F98] border border-[#1F2125] rounded">
                    Integral
                  </span>
                </div>
              </div>

              <div className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-4 flex flex-col justify-between transition-colors duration-100">
                <span className="text-[12.5px] font-normal text-[#8A8F98]">
                  Crianças (até 10 anos)
                </span>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-medium text-[#F7F8F8] tabular-nums leading-none tracking-[-0.03em]">
                    {stats.children}
                  </span>
                  <span className="text-[11.5px] px-1.5 py-0.5 bg-[#16181C] text-[#8A8F98] border border-[#1F2125] rounded">
                    Infantil
                  </span>
                </div>
              </div>

              <div className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-4 flex flex-col justify-between transition-colors duration-100 relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-normal text-[#8A8F98]">
                      Check-ins realizados
                    </span>
                    <span className="text-[12px] font-medium text-emerald-400 tabular-nums">
                      {stats.checkInPercentage}%
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-medium text-emerald-400 tabular-nums leading-none tracking-[-0.03em]">
                      {stats.checkedIn}
                    </span>
                    <span className="text-[12px] text-[#8A8F98] tabular-nums">
                      faltam {Math.max(0, stats.total - stats.checkedIn)}
                    </span>
                  </div>
                </div>

                {/* Barra de progresso fina em verde esmeralda */}
                <div className="mt-3 w-full h-1 bg-[#1F2125] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                    style={{ width: `${stats.checkInPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={stats.checkedIn}
                    aria-valuemin="0"
                    aria-valuemax={stats.total}
                    aria-label={`Progresso de check-ins: ${stats.checkInPercentage}%`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Banner de Alerta Automático de Duplicidades (Significado Semântico Vermelho) */}
          {stats.duplicateRecordsCount > 0 && (
            <section
              aria-label="Alerta de duplicidades na lista"
              role="alert"
              className="bg-[#111214] border border-red-500/30 hover:border-red-500/45 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-100"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <AlertIcon className="w-4 h-4 text-red-400 shrink-0" />
                  <h2 className="text-[13.5px] font-medium text-[#F7F8F8]">
                    {stats.duplicateRecordsCount} registros com nome duplicado ou similar detectados
                  </h2>
                </div>
                <p className="text-[13px] text-[#8A8F98] font-normal leading-relaxed pl-6">
                  Nomes em revisão:{' '}
                  <span className="font-medium text-red-400">
                    {stats.uniqueDuplicateNames.join(', ')}
                  </span>
                  . Compare quem confirmou cada registro, remova a sobra ou marque como não duplicado.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveFilter((prev) =>
                    prev === 'duplicates' ? 'all' : 'duplicates'
                  )
                }
                className="shrink-0 h-8 px-3 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-medium text-[13px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-red-400"
              >
                {activeFilter === 'duplicates'
                  ? 'Mostrar Todos os Convidados'
                  : `Filtrar Duplicados (${stats.duplicateRecordsCount})`}
              </button>
            </section>
          )}

          {/* 3. Barra de Busca Instantânea e Filtros Rápidos (Controles 13px-14px) */}
          <section
            aria-label="Busca e filtros da lista"
            className="bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors duration-100"
          >
            <div className="relative flex-1">
              <label htmlFor="guest-search" className="sr-only">
                Buscar por nome do convidado ou responsável pela confirmação
              </label>
              <SearchIcon className="w-4 h-4 text-[#8A8F98] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="guest-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar convidado ou quem confirmou (ex: Mariana, Beatriz)..."
                className="w-full h-8 bg-[#08090A] border border-[#1F2125] hover:border-[#2E3138] rounded-lg text-[#F7F8F8] placeholder:text-[#8A8F98]/60 pl-9 pr-16 text-[13.5px] font-normal focus:bg-[#111214] focus:outline-none focus:border-[#434854] transition-colors duration-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#16181C] border border-[#23262C] hover:border-[#2E3138] rounded text-[12px] text-[#8A8F98] hover:text-[#F7F8F8] transition-colors duration-100"
                >
                  Limpar
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap gap-1.5"
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
                    className={`h-8 px-3 text-[13px] font-medium tabular-nums rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 ${
                      isDuplicateBtn && btn.count > 0
                        ? isActive
                          ? 'bg-red-500/25 border border-red-500/50 text-red-300 focus-visible:outline-red-400'
                          : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20 focus-visible:outline-red-400'
                        : isActive
                        ? 'bg-[#22242A] border border-[#343841] text-[#F7F8F8] focus-visible:outline-[#434854]'
                        : 'bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] hover:bg-[#16181C] text-[#8A8F98] hover:text-[#F7F8F8] focus-visible:outline-[#434854]'
                    }`}
                  >
                    {btn.label}{' '}
                    <span className="opacity-75 ml-0.5">({btn.count})</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Aviso de feedback ao restaurar dados de exemplo */}
          {feedbackNotice && (
            <div
              role="status"
              className="bg-[#111214] border border-[#1F2125] rounded-lg text-[#F7F8F8] px-4 py-2.5 text-[13px] font-normal"
            >
              {feedbackNotice}
            </div>
          )}

          {/* 4. Lista Alfabética da Portaria (Alta densidade de trabalho Linear) */}
          <section aria-labelledby="guest-list-heading" className="space-y-2.5">
            <div className="flex items-baseline justify-between px-1">
              <h2
                id="guest-list-heading"
                className="text-[14px] font-medium text-[#F7F8F8] tracking-[-0.01em]"
              >
                Lista Alfabética da Portaria (A a Z)
              </h2>
              <span className="text-[12.5px] text-[#8A8F98] font-normal tabular-nums">
                Exibindo {filteredGuests.length} de {stats.total}
              </span>
            </div>

            {isLoading ? (
              <div className="bg-[#111214] border border-[#1F2125] rounded-xl p-8 text-center text-[13.5px] text-[#8A8F98]">
                Carregando lista da portaria...
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="bg-[#111214] border border-[#1F2125] rounded-xl p-8 text-center space-y-3">
                <p className="text-[14px] text-[#F7F8F8] font-medium">
                  Nenhum convidado encontrado com os filtros atuais.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(searchQuery || activeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                      className="h-8 px-3.5 bg-[#16181C] border border-[#1F2125] hover:border-[#2E3138] text-[#F7F8F8] text-[13px] font-medium rounded-lg transition-colors duration-100"
                    >
                      Limpar busca e filtros
                    </button>
                  )}
                  {stats.total === 0 && (
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="h-8 px-3.5 bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] text-[#F7F8F8] text-[13px] font-medium rounded-lg transition-colors duration-100"
                    >
                      Carregar dados de exemplo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#111214] border border-[#1F2125] rounded-xl overflow-hidden divide-y divide-[#1F2125]">
                <ul aria-label="Convidados confirmados" className="divide-y divide-[#1F2125]">
                  {filteredGuests.map((guest) => {
                    const isConfirmingDelete = pendingDeleteId === guest.id;

                    return (
                      <li
                        key={guest.id}
                        className={`px-4 py-2.5 transition-colors duration-100 ${
                          guest.isDuplicate
                            ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]'
                            : guest.checkedIn
                            ? 'bg-emerald-500/[0.02] hover:bg-[#16181C]'
                            : 'bg-[#111214] hover:bg-[#16181C]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          {/* Informações do convidado compactas em linha */}
                          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span
                                className={`text-[14px] font-medium truncate transition-colors duration-100 ${
                                  guest.checkedIn
                                    ? 'line-through text-[#8A8F98]'
                                    : 'text-[#F7F8F8]'
                                }`}
                              >
                                {guest.name}
                              </span>

                              {/* Badge de Faixa Etária (Neutro sutil) */}
                              <span className="inline-flex items-center px-2 py-0.5 text-[12px] font-normal rounded bg-[#16181C] text-[#8A8F98] border border-[#1F2125]">
                                {guest.ageBadge}
                              </span>

                              {/* Badge de Check-in Concluído (Verde Esmeralda Semântico) */}
                              {guest.checkedIn && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                                  <CheckIcon className="w-3.5 h-3.5" />
                                  Presente
                                </span>
                              )}

                              {/* Destaque de Duplicidade (Vermelho Semântico) */}
                              {guest.isDuplicate && guest.duplicateBadgeLabel && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 rounded">
                                  <AlertIcon className="w-3.5 h-3.5" />
                                  {guest.duplicateBadgeLabel}
                                </span>
                              )}
                            </div>

                            <span className="hidden sm:inline text-[#2E3138] text-xs select-none">•</span>

                            <p className="text-[13px] text-[#8A8F98] font-normal truncate">
                              {guest.originLabel}
                            </p>
                          </div>

                          {/* Controles Operacionais compactos com ícones de 16px (w-4 h-4) e resposta de 100ms */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t border-[#1F2125] sm:border-0 w-full sm:w-auto justify-end shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(guest.id)}
                              aria-pressed={guest.checkedIn}
                              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 ${
                                guest.checkedIn
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 focus-visible:outline-emerald-400'
                                  : 'bg-[#16181C] border border-[#1F2125] hover:border-[#2E3138] text-[#F7F8F8] hover:bg-[#1C1E23] focus-visible:outline-[#434854]'
                              }`}
                            >
                              {guest.checkedIn ? (
                                <>
                                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                                  <span>Check-in Feito</span>
                                </>
                              ) : (
                                <>
                                  <CircleIcon className="w-4 h-4 text-[#8A8F98]" />
                                  <span>Check-in</span>
                                </>
                              )}
                            </button>

                            {guest.isDuplicate && (
                              <button
                                type="button"
                                onClick={() => handleDismissDuplicate(guest)}
                                className="inline-flex items-center justify-center h-8 px-2.5 text-[13px] font-normal bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-100 shrink-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-red-400"
                                aria-label={`Dispensar alerta de duplicidade para ${guest.name}`}
                              >
                                Não é duplicado
                              </button>
                            )}

                            {!isConfirmingDelete ? (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(guest.id)}
                                className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 text-[13px] font-normal bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#16181C] rounded-lg transition-colors duration-100 shrink-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#434854]"
                                aria-label={`Remover ${guest.name} da lista`}
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span>Remover</span>
                              </button>
                            ) : (
                              <div
                                className="flex items-center gap-1 bg-[#16181C] border border-red-500/30 rounded-lg p-0.5 shrink-0"
                                role="group"
                                aria-label={`Confirmar remoção de ${guest.name}`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConfirmRemoveGuest(guest.id)
                                  }
                                  className="h-7 px-2.5 text-[12px] font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-md transition-colors duration-100"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="h-7 px-2 text-[12px] font-normal bg-transparent text-[#8A8F98] hover:text-[#F7F8F8] rounded-md transition-colors duration-100"
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
              </div>
            )}
          </section>
        </main>

        {/* Rodapé Operacional com Restauração de Dados de Exemplo e Assinatura */}
        <footer className="mt-12 bg-[#111214] border-t border-[#1F2125] py-6">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {!confirmResetDemo ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetDemo(true)}
                  className="h-8 px-3 text-[13px] font-normal text-[#8A8F98] hover:text-[#F7F8F8] bg-[#16181C] border border-[#1F2125] hover:border-[#2E3138] rounded-lg transition-colors duration-100"
                >
                  Restaurar dados de exemplo
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 bg-[#16181C] border border-[#1F2125] rounded-lg p-1.5">
                  <span className="text-[12.5px] text-[#F7F8F8] px-2">
                    Substituir lista atual pelos 11 convidados de exemplo?
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="h-7 px-2.5 text-[12px] font-medium bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] text-[#F7F8F8] rounded-md transition-colors duration-100"
                  >
                    Sim, restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetDemo(false)}
                    className="h-7 px-2.5 text-[12px] font-normal bg-[#111214] border border-[#1F2125] hover:border-[#2E3138] text-[#8A8F98] hover:text-[#F7F8F8] rounded-md transition-colors duration-100"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <Link
                to={`/convite/${event.slug}`}
                className="text-[13px] font-normal text-[#8A8F98] hover:text-[#F7F8F8] transition-colors duration-100"
              >
                Ver página do convite
              </Link>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5 text-[12.5px] text-[#8A8F98]">
              <a
                href={event.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#8A8F98] hover:text-[#FFFFFF] transition-colors duration-100"
              >
                <span>Feito por</span>
                <ObzaWordmark className="h-2.5 w-auto text-[#F7F8F8] inline-block" />
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
            <div className="bg-[#111214] border border-[#1F2125] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <AlertIcon className="w-4 h-4 text-red-400 shrink-0" />
                <h3
                  id="duplicate-modal-title"
                  className="text-lg font-medium text-[#F7F8F8] tracking-[-0.02em]"
                >
                  Nomes duplicados na lista
                </h3>
              </div>

              <p className="text-[13.5px] text-[#8A8F98] font-normal leading-relaxed">
                Ainda existem{' '}
                <span className="font-medium text-red-400">
                  {stats.duplicateRecordsCount} registros
                </span>{' '}
                com nome repetido ({stats.uniqueDuplicateNames.join(', ')}). Deseja revisar antes de imprimir a folha da portaria?
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  autoFocus
                  onClick={handleReviewDuplicatesFromModal}
                  className="flex-1 h-9 px-4 bg-[#22242A] hover:bg-[#2A2D35] border border-[#343841] hover:border-[#434854] text-[#F7F8F8] font-medium text-[13.5px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#434854]"
                >
                  Revisar duplicados
                </button>
                <button
                  type="button"
                  onClick={handlePrintAnywayFromModal}
                  className="h-9 px-4 bg-[#16181C] border border-[#1F2125] hover:border-[#2E3138] text-[#8A8F98] hover:text-[#F7F8F8] font-normal text-[13.5px] rounded-lg transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#434854]"
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
              <ObzaBrand
                iconClassName="w-4 h-4 text-[#111111]"
                wordmarkClassName="h-3.5 w-auto text-[#111111]"
                className="inline-flex items-center gap-2 text-[#111111]"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                • Lista de Portaria
              </span>
            </div>
            <span className="text-xs font-medium text-[#333333]">
              Ordem Alfabética (A a Z)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
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
