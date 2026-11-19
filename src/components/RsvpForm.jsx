import React, { useState, useMemo } from 'react';
import { validateGuestName, extractFirstName } from '../utils/validators';
import { addGuests } from '../services/rsvpService';
import { triggerEditorialConfetti } from '../utils/confetti';

const AGE_OPTIONS = [
  { id: 'adult', label: 'Adulto' },
  { id: 'child', label: 'Criança até 10 anos' },
];

export default function RsvpForm({ event, forceClosed = false }) {
  const [leadName, setLeadName] = useState('');
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedState, setConfirmedState] = useState(null);

  const isDeadlinePassed = useMemo(() => {
    if (forceClosed) return true;
    if (!event?.rsvpDeadlineIso) return false;
    const deadlineMs = new Date(event.rsvpDeadlineIso).getTime();
    return !Number.isNaN(deadlineMs) && Date.now() > deadlineMs;
  }, [event?.rsvpDeadlineIso, forceClosed]);

  const maxCompanions = event?.maxCompanions ?? 5;
  const companionCounts = Array.from({ length: maxCompanions + 1 }, (_, i) => i);

  const handleCompanionCountChange = (nextCount) => {
    setCompanionCount(nextCount);
    setCompanions((prev) => {
      const updated = [...prev];
      while (updated.length < nextCount) {
        updated.push({ name: '', ageGroup: 'adult' });
      }
      return updated.slice(0, nextCount);
    });
    // Limpa erros de acompanhantes removidos
    setErrors((prev) => {
      const nextErrors = { ...prev };
      for (let i = nextCount; i <= maxCompanions; i += 1) {
        delete nextErrors[`companion_${i}`];
      }
      return nextErrors;
    });
  };

  const handleCompanionChange = (index, field, value) => {
    setCompanions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    if (field === 'name' && errors[`companion_${index}`]) {
      setErrors((prev) => ({ ...prev, [`companion_${index}`]: null }));
    }
  };

  // Resumo automático do total de pessoas antes do envio (o titular é sempre adulto)
  const summary = useMemo(() => {
    const activeCompanions = companions.slice(0, companionCount);
    const totalPeople = 1 + companionCount;
    const adultsCount =
      1 + activeCompanions.filter((c) => c.ageGroup === 'adult').length;
    const childrenCount = totalPeople - adultsCount;

    return {
      totalPeople,
      adultsCount,
      childrenCount,
    };
  }, [companions, companionCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    const leadValidation = validateGuestName(leadName, 'seu nome e sobrenome');
    if (!leadValidation.valid) {
      nextErrors.leadName = leadValidation.error;
    }

    const activeCompanions = companions.slice(0, companionCount);
    const sanitizedCompanions = [];
    const seenNames = new Set();

    if (leadValidation.valid) {
      seenNames.add(leadValidation.sanitizedName.toLowerCase());
    }

    activeCompanions.forEach((comp, idx) => {
      const validation = validateGuestName(
        comp.name,
        `o nome e sobrenome do acompanhante ${idx + 1}`
      );
      if (!validation.valid) {
        nextErrors[`companion_${idx}`] = validation.error;
      } else {
        const lower = validation.sanitizedName.toLowerCase();
        if (seenNames.has(lower)) {
          nextErrors[`companion_${idx}`] =
            'Este nome já foi informado acima nesta mesma confirmação.';
        } else {
          seenNames.add(lower);
          sanitizedCompanions.push({
            name: validation.sanitizedName,
            ageGroup: comp.ageGroup,
            isLead: false,
          });
        }
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const allMembers = [
        {
          name: leadValidation.sanitizedName,
          ageGroup: 'adult',
          isLead: true,
        },
        ...sanitizedCompanions,
      ];

      const result = await addGuests(event.id, allMembers, {
        webhookUrl: event.webhookUrl,
      });

      const firstName = extractFirstName(leadValidation.sanitizedName);

      setConfirmedState({
        firstName,
        leadFullName: result.groupLead,
        records: result.createdRecords,
        adultsCount: summary.adultsCount,
        childrenCount: summary.childrenCount,
      });

      triggerEditorialConfetti(event?.palette?.confetti);
    } catch (err) {
      setErrors({
        form:
          err?.message ||
          'Não foi possível salvar sua confirmação. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDeadlinePassed) {
    return (
      <div
        className="bg-surface p-7 sm:p-10"
        role="region"
        aria-label="Prazo de confirmação encerrado"
      >
        <h3 className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.05] tracking-[-0.02em] mb-4">
          Lista de presença encerrada
        </h3>
        <p className="text-base text-textPrimary leading-relaxed mb-4">
          O prazo para confirmação de presença encerrou em{' '}
          <strong className="font-semibold text-accent">
            {event.rsvpDeadlineFormatted}
          </strong>{' '}
          para organização final da recepção junto ao {event.venueName}.
        </p>
        <p className="text-base text-textMuted leading-relaxed">
          Caso precise comunicar alguma alteração urgente, entre em contato diretamente com a família de {event.honoreeFirstName}.
        </p>
      </div>
    );
  }

  if (confirmedState) {
    return (
      <div
        className="bg-surface p-7 sm:p-10 transition-all duration-300"
        role="status"
        aria-live="polite"
      >
        <p className="text-base font-medium text-accent mb-2">
          Presença Confirmada na Lista Oficial
        </p>
        <h3 className="font-display text-4xl sm:text-5xl font-semibold text-textPrimary leading-[1.02] tracking-[-0.02em] mb-4">
          Até breve, {confirmedState.firstName}.
        </h3>
        <p className="text-base text-textPrimary leading-relaxed mb-8">
          Que alegria contar com você! Seus nomes já foram registrados na portaria do{' '}
          <strong className="font-semibold">{event.venueName}</strong> para a noite de {event.eventDateFormatted}.
        </p>

        <div className="bg-surfaceElevated p-6 mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-base font-semibold text-textPrimary">
              Convidados registrados
            </span>
            <span className="text-base font-semibold text-accent tabular-nums">
              {confirmedState.records.length}{' '}
              {confirmedState.records.length === 1 ? 'pessoa' : 'pessoas'}
            </span>
          </div>

          <ul className="space-y-3">
            {confirmedState.records.map((guest) => (
              <li
                key={guest.id}
                className="flex flex-wrap items-baseline justify-between gap-2 bg-surface px-4 py-3"
              >
                <span className="text-base font-medium text-textPrimary">
                  {guest.name}
                </span>
                <span className="text-sm text-textMuted">
                  {guest.ageGroup}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {event.mapsUrl && (
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center flex-1 px-6 py-4 bg-accent text-accentInk font-semibold text-base transition-transform duration-150 active:scale-[0.98] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ver Local no Google Maps
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setLeadName('');
              setCompanionCount(0);
              setCompanions([]);
              setConfirmedState(null);
            }}
            className="inline-flex items-center justify-center px-6 py-4 bg-surfaceElevated text-textPrimary font-medium text-base transition-transform duration-150 active:scale-[0.98] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Confirmar outro convite
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface p-6 sm:p-10 space-y-8"
    >
      {/* Titular do Convite */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="lead-full-name"
            className="block text-base font-semibold text-textPrimary mb-2"
          >
            Seu nome completo
          </label>
          <input
            id="lead-full-name"
            type="text"
            autoComplete="name"
            value={leadName}
            onChange={(e) => {
              setLeadName(e.target.value);
              if (errors.leadName) {
                setErrors((prev) => ({ ...prev, leadName: null }));
              }
            }}
            placeholder="Ex: Mariana Alves Ribeiro"
            aria-invalid={Boolean(errors.leadName)}
            aria-describedby={errors.leadName ? 'lead-name-error' : 'lead-name-hint'}
            className="w-full bg-surfaceElevated text-textPrimary placeholder:text-textMuted/60 px-4 py-4 text-base focus:outline focus:outline-2 focus:outline-accent transition-colors"
          />
          {errors.leadName ? (
            <p
              id="lead-name-error"
              role="alert"
              className="mt-2 text-sm font-medium text-accent"
            >
              {errors.leadName}
            </p>
          ) : (
            <p id="lead-name-hint" className="mt-2 text-sm text-textMuted">
              Informe nome e sobrenome como constará na recepção do {event.venueName}.
            </p>
          )}
        </div>
      </div>

      {/* Seletor de Acompanhantes (0 a 5) */}
      <div className="space-y-4">
        <fieldset>
          <legend className="block text-base font-semibold text-textPrimary mb-1.5">
            Você levará acompanhantes?
          </legend>
          <p
            id="anti-duplicity-notice"
            className="text-sm text-textMuted leading-relaxed mb-4"
          >
            Inclua apenas quem não recebeu este convite separadamente (ex: cônjuge, filhos).
          </p>

          <div
            className="grid grid-cols-6 gap-2"
            role="radiogroup"
            aria-describedby="anti-duplicity-notice"
          >
            {companionCounts.map((count) => {
              const isSelected = companionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={
                    count === 0
                      ? 'Nenhum acompanhante'
                      : `${count} ${count === 1 ? 'acompanhante' : 'acompanhantes'}`
                  }
                  onClick={() => handleCompanionCountChange(count)}
                  className={`py-3.5 text-center text-base tabular-nums font-semibold transition-all duration-150 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isSelected
                      ? 'bg-accent text-accentInk'
                      : 'bg-surfaceElevated text-textPrimary hover:opacity-90'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Campos dinâmicos obrigatórios para cada acompanhante */}
        {companionCount > 0 && (
          <div className="space-y-6 pt-3">
            {companions.slice(0, companionCount).map((companion, idx) => {
              const fieldError = errors[`companion_${idx}`];
              const inputId = `companion-name-${idx}`;
              const errorId = `companion-error-${idx}`;

              return (
                <div
                  key={idx}
                  className="bg-surfaceElevated p-5 space-y-4 transition-all duration-200"
                >
                  <div>
                    <label
                      htmlFor={inputId}
                      className="block text-base font-semibold text-textPrimary mb-2"
                    >
                      Nome completo do acompanhante {idx + 1}
                    </label>
                    <input
                      id={inputId}
                      type="text"
                      value={companion.name}
                      onChange={(e) =>
                        handleCompanionChange(idx, 'name', e.target.value)
                      }
                      placeholder="Nome e sobrenome"
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? errorId : undefined}
                      className="w-full bg-bgMain text-textPrimary placeholder:text-textMuted/60 px-4 py-3.5 text-base focus:outline focus:outline-2 focus:outline-accent"
                    />
                    {fieldError && (
                      <p
                        id={errorId}
                        role="alert"
                        className="mt-2 text-sm font-medium text-accent"
                      >
                        {fieldError}
                      </p>
                    )}
                  </div>

                  <fieldset>
                    <legend className="block text-sm font-medium text-textMuted mb-2">
                      Faixa etária do acompanhante {idx + 1}
                    </legend>
                    <div className="grid grid-cols-2 gap-2.5">
                      {AGE_OPTIONS.map((option) => {
                        const isSelected = companion.ageGroup === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() =>
                              handleCompanionChange(idx, 'ageGroup', option.id)
                            }
                            className={`px-3.5 py-3 text-left text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                              isSelected
                                ? 'bg-accent text-accentInk font-semibold'
                                : 'bg-surface text-textPrimary hover:opacity-90'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo automático do total de pessoas antes do envio */}
      <div
        className="bg-bgMain p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        aria-live="polite"
      >
        <div>
          <p className="text-base font-semibold text-textPrimary">
            Resumo da sua confirmação
          </p>
          <p className="text-sm text-textMuted tabular-nums mt-0.5">
            {summary.adultsCount}{' '}
            {summary.adultsCount === 1 ? 'adulto' : 'adultos'}
            {summary.childrenCount > 0 && (
              <>
                {' '}
                e {summary.childrenCount}{' '}
                {summary.childrenCount === 1
                  ? 'criança até 10 anos'
                  : 'crianças até 10 anos'}
              </>
            )}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="font-display text-3xl font-semibold text-accent tabular-nums">
            {summary.totalPeople}{' '}
            {summary.totalPeople === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="text-sm font-medium text-accent">
          {errors.form}
        </p>
      )}

      {/* Botão de Envio */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-accent text-accentInk font-semibold text-base transition-transform duration-150 active:scale-[0.99] hover:opacity-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {isSubmitting
            ? 'Registrando presença...'
            : `Confirmar Presença (${summary.totalPeople} ${
                summary.totalPeople === 1 ? 'pessoa' : 'pessoas'
              })`}
        </button>

        <p className="text-sm text-textMuted text-left">
          Confirmações abertas até {event.rsvpDeadlineFormatted}.
        </p>
      </div>
    </form>
  );
}
