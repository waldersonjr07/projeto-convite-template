import React from 'react';

/**
 * Ilustração editorial botânica plana (ramo de oliveira e arco arquitetônico)
 * desenhada nas cores exatas da paleta do evento (sem gradientes nem sombras).
 */
export function OliveArchGraphic({ className = '' }) {
  return (
    <svg
      viewBox="0 0 360 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Composição botânica em tons de oliva e linho"
    >
      {/* Fundo em bloco de tom superfície elevada */}
      <rect width="360" height="220" fill="var(--surface)" />

      {/* Arco arquitetônico de fundo */}
      <path
        d="M90 220V110C90 60.2944 130.294 20 180 20C229.706 20 270 60.2944 270 110V220H90Z"
        fill="var(--surface-elevated)"
      />

      {/* Disco solar cálido em tom areia/dourado fosco */}
      <circle cx="180" cy="108" r="44" fill="var(--accent)" />

      {/* Ramo de oliveira orgânico em verde sálvia e oliva */}
      <path
        d="M118 188C144 152 178 122 232 82"
        stroke="var(--bg-main)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Folhas de oliveira em tom sálvia e linho */}
      <path
        d="M142 154C130 144 128 128 140 120C152 128 154 144 142 154Z"
        fill="var(--sage)"
      />
      <path
        d="M168 132C156 122 156 106 168 96C180 106 180 122 168 132Z"
        fill="var(--text-primary)"
      />
      <path
        d="M198 108C188 96 190 80 202 72C214 82 210 98 198 108Z"
        fill="var(--sage)"
      />
      <path
        d="M154 162C168 156 184 162 188 174C174 180 158 174 154 162Z"
        fill="var(--sage)"
      />
      <path
        d="M184 138C198 132 214 138 218 150C204 156 188 150 184 138Z"
        fill="var(--text-primary)"
      />
      <path
        d="M212 114C226 108 242 114 246 126C232 132 216 126 212 114Z"
        fill="var(--sage)"
      />

      {/* Fruto de oliva em tom principal */}
      <circle cx="174" cy="144" r="6.5" fill="var(--bg-main)" />
      <circle cx="204" cy="118" r="5.5" fill="var(--bg-main)" />
    </svg>
  );
}
