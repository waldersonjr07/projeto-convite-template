import React, { useState, useEffect, useRef } from 'react';
import { triggerEditorialConfetti } from '../utils/confetti';

function calculateTimeLeft(targetIso) {
  const targetTime = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = targetTime - now;

  if (Number.isNaN(targetTime) || diff <= 0) {
    return {
      isLive: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    isLive: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function padTwo(num) {
  return String(num).padStart(2, '0');
}

export default function Countdown({
  eventDateIso,
  venueName,
  venueAddress,
  mapsUrl,
  confettiColors,
  forceLive = false,
}) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(eventDateIso));
  const confettiFiredRef = useRef(false);

  const isLiveNow = forceLive || timeLeft.isLive;

  useEffect(() => {
    if (forceLive) return undefined;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventDateIso));
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDateIso, forceLive]);

  useEffect(() => {
    if (isLiveNow && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      triggerEditorialConfetti(confettiColors);
    }
  }, [isLiveNow, confettiColors]);

  if (isLiveNow) {
    return (
      <div
        className="bg-surface p-7 sm:p-9 transition-colors duration-300"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-block w-3 h-3 rounded-full bg-accent animate-pulse"
            aria-hidden="true"
          />
          <span className="text-base font-semibold text-accent">
            Ao Vivo • Recepção Iniciada
          </span>
        </div>

        <h3 className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.02] tracking-[-0.02em] mb-3">
          A noite começou no {venueName}
        </h3>

        <p className="text-base text-textPrimary leading-relaxed mb-6">
          As portas do {venueName} já estão abertas para celebrarmos juntos em Cáceres. Estamos esperando por você na recepção.
        </p>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-4 bg-accent text-accentInk font-semibold text-base transition-transform duration-150 active:scale-[0.98] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Abrir Rota para o {venueName}
          </a>
        )}
      </div>
    );
  }

  const units = [
    { label: 'Dias', value: padTwo(timeLeft.days) },
    { label: 'Horas', value: padTwo(timeLeft.hours) },
    { label: 'Minutos', value: padTwo(timeLeft.minutes) },
    { label: 'Segundos', value: padTwo(timeLeft.seconds) },
  ];

  return (
    <div aria-label="Contagem regressiva para a celebração">
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="bg-surface px-3 py-5 sm:px-5 sm:py-7 flex flex-col items-start justify-between"
          >
            <span className="font-display text-4xl sm:text-5xl font-semibold text-textPrimary tabular-nums leading-none tracking-[-0.03em]">
              {unit.value}
            </span>
            <span className="text-sm font-medium text-textMuted mt-3">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
