import React, { useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  getEventBySlug,
  getEventCssVariables,
  DEFAULT_EVENT_SLUG,
} from '../config/events';
import Countdown from '../components/Countdown';
import RsvpForm from '../components/RsvpForm';
import { OliveArchGraphic } from '../components/BotanicalMotif';

export default function InvitePage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const event = getEventBySlug(slug || DEFAULT_EVENT_SLUG);

  // Suporte discreto via query string para demonstração comercial (?estado=aovivo ou ?estado=encerrado)
  const previewState = searchParams.get('estado');
  const forceLive = previewState === 'aovivo';
  const forceClosed = previewState === 'encerrado';

  useEffect(() => {
    if (!event) return;
    const cssVars = getEventCssVariables(event);
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    document.title = `${event.honoree} — 15 Anos | ${event.venueName}`;
  }, [event]);

  if (!event) {
    return (
      <main className="min-h-screen bg-bgMain text-textPrimary flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-surface p-8 sm:p-10">
          <h1 className="font-display text-4xl font-semibold text-textPrimary leading-tight mb-4">
            Convite não encontrado
          </h1>
          <p className="text-base text-textMuted leading-relaxed mb-8">
            Verifique o endereço digitado ou acesse o convite demonstrativo de Helena Mendes Cavalcante.
          </p>
          <Link
            to={`/convite/${DEFAULT_EVENT_SLUG}`}
            className="inline-flex items-center justify-center w-full px-6 py-4 bg-accent text-accentInk font-semibold text-base"
          >
            Abrir Convite Demonstrativo
          </Link>
        </div>
      </main>
    );
  }

  const cssVariables = getEventCssVariables(event);

  return (
    <div
      style={cssVariables}
      className="min-h-screen bg-bgMain text-textPrimary font-sans selection:bg-accent selection:text-accentInk"
    >
      {/* Barra de Navegação Editorial */}
      <header className="max-w-4xl mx-auto px-5 sm:px-8 pt-6 pb-4 flex items-center justify-between gap-4">
        <a
          href="#topo"
          className="font-display text-2xl font-semibold text-textPrimary tracking-[-0.02em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {event.honoreeFirstName} • 15 Anos
        </a>

        <nav aria-label="Navegação do convite" className="flex items-center gap-5 sm:gap-7">
          <a
            href="#tempo"
            className="text-sm sm:text-base text-textMuted hover:text-textPrimary transition-colors"
          >
            Data
          </a>
          <a
            href="#recepcao"
            className="text-sm sm:text-base text-textMuted hover:text-textPrimary transition-colors"
          >
            Local
          </a>
          <a
            href="#confirmacao"
            className="text-sm sm:text-base font-semibold text-accent hover:opacity-90 transition-opacity"
          >
            Confirmar
          </a>
        </nav>
      </header>

      <main id="topo" className="max-w-4xl mx-auto px-5 sm:px-8">
        {/* 1. Primeira Dobra (Hero Editorial) */}
        <section
          aria-labelledby="hero-title"
          className="pt-8 pb-16 sm:pt-14 sm:pb-24 reveal-section"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-end">
            <div className="md:col-span-7">
              <h1
                id="hero-title"
                className="font-display text-[2.85rem] sm:text-6xl md:text-[4.25rem] font-semibold text-textPrimary leading-[0.95] tracking-[-0.03em]"
              >
                <span className="block">{event.headlineLines[0]}</span>
                <span className="block">{event.headlineLines[1]}</span>
              </h1>

              <p className="mt-7 text-lg sm:text-xl text-textPrimary leading-relaxed">
                Convida para celebrar seus 15 anos no{' '}
                <strong className="font-semibold text-accent">
                  sábado, 19 de dezembro de 2026, às 20h
                </strong>
                , no {event.venueName} em Cáceres.
              </p>

              <p className="mt-4 text-base text-textMuted leading-relaxed">
                {event.invitationStatement}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                <a
                  href="#confirmacao"
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accentInk font-semibold text-base transition-transform duration-150 active:scale-[0.98] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Confirmar Presença
                </a>
                <a
                  href="#recepcao"
                  className="inline-flex items-center justify-center px-7 py-4 bg-surface text-textPrimary font-medium text-base transition-transform duration-150 active:scale-[0.98] hover:bg-surfaceElevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Ver Local e Traje
                </a>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="bg-surface p-5 sm:p-6">
                <OliveArchGraphic className="w-full h-auto block" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl font-semibold text-textPrimary">
                    19 de Dezembro, 20h
                  </span>
                  <span className="text-sm font-medium text-accent">
                    {event.venueName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Seção de Contagem Regressiva */}
        <section
          id="tempo"
          aria-labelledby="countdown-heading"
          className="py-14 sm:py-20 reveal-section"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
            <div className="md:col-span-5">
              <h2
                id="countdown-heading"
                className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.02] tracking-[-0.02em]"
              >
                Tempo até a Festa
              </h2>
              <p className="mt-3 text-base text-textMuted leading-relaxed">
                Contamos cada instante para receber nossa família e amigos no salão do {event.venueName}.
              </p>
            </div>

            <div className="md:col-span-7">
              <Countdown
                eventDateIso={event.eventDateIso}
                venueName={event.venueName}
                venueAddress={event.venueAddress}
                mapsUrl={event.mapsUrl}
                confettiColors={event.palette?.confetti}
                forceLive={forceLive}
              />
            </div>
          </div>
        </section>

        {/* 3. Seção de Recepção, Endereço e Observação Especial (Traje) */}
        <section
          id="recepcao"
          aria-labelledby="venue-heading"
          className="py-14 sm:py-20 reveal-section"
        >
          <div className="mb-8">
            <h2
              id="venue-heading"
              className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.02] tracking-[-0.02em]"
            >
              Local e Recepção
            </h2>
            <p className="mt-3 text-base text-textMuted leading-relaxed">
              Tudo preparado com carinho no coração de Cáceres para uma noite inesquecível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Bloco Principal do Espaço Five Buffet */}
            <div className="md:col-span-7 bg-surface p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-accent mb-2">
                  Salão de Eventos
                </p>
                <h3 className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.05] tracking-[-0.02em] mb-3">
                  {event.venueName}
                </h3>
                <p className="text-base text-textPrimary leading-relaxed">
                  {event.venueAddress}
                </p>
                <p className="text-base text-textMuted mt-2">
                  {event.eventDateFormatted} • {event.eventTimeFormatted}
                </p>
              </div>

              <div className="mt-8">
                <a
                  href={event.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-4 bg-surfaceElevated text-textPrimary font-semibold text-base transition-transform duration-150 active:scale-[0.98] hover:bg-accent hover:text-accentInk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Abrir {event.venueName} no Google Maps
                </a>
              </div>
            </div>

            {/* Bloco de Observação Especial (Traje Esporte Fino) e Prazo */}
            <div className="md:col-span-5 flex flex-col gap-5">
              {event.specialNote && (
                <div className="bg-surface p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-sage mb-2">
                      {event.specialNoteTitle || 'Observação Especial'}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold text-textPrimary leading-tight mb-2">
                      {event.specialNote}
                    </h3>
                    <p className="text-base text-textMuted leading-relaxed">
                      {event.specialNoteDescription}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-surfaceElevated p-7">
                <p className="text-sm font-medium text-accent mb-1.5">
                  Lista da Portaria
                </p>
                <p className="text-base text-textPrimary leading-relaxed">
                  Confirmação individual até{' '}
                  <strong className="font-semibold">
                    {event.rsvpDeadlineFormatted}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Seção de Confirmação de Presença (RSVP Blindado) */}
        <section
          id="confirmacao"
          aria-labelledby="rsvp-heading"
          className="py-14 sm:py-20 reveal-section"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start">
            <div className="md:col-span-4">
              <h2
                id="rsvp-heading"
                className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary leading-[1.02] tracking-[-0.02em]"
              >
                Confirme sua Presença
              </h2>
              <p className="mt-4 text-base text-textPrimary leading-relaxed">
                Para sua comodidade na recepção do{' '}
                <strong className="font-semibold">{event.venueName}</strong>, registre seu nome e o de seus acompanhantes diretos.
              </p>
              <p className="mt-3 text-sm text-textMuted leading-relaxed">
                Prazo limite: {event.rsvpDeadlineFormatted}.
              </p>
            </div>

            <div className="md:col-span-8">
              <RsvpForm event={event} forceClosed={forceClosed} />
            </div>
          </div>
        </section>
      </main>

      {/* 5. Rodapé Editorial */}
      <footer className="mt-12 bg-surface py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="font-display text-3xl sm:text-4xl font-semibold text-textPrimary tracking-[-0.02em]">
                {event.honoree}
              </p>
              <p className="mt-2 text-base font-medium text-accent">
                {event.footerReception}
              </p>
              <p className="mt-1 text-sm text-textMuted">
                {event.venueAddress}
              </p>
            </div>

            <div className="sm:text-right">
              <a
                href={event.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-textMuted hover:text-textPrimary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {event.authorName}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
