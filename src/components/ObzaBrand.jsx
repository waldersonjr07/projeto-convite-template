import React from 'react';

/**
 * Símbolo oficial da marca OBZA (losango / triângulo partido).
 * Reproduz em SVG puro a geometria exata de `use_obza/obza_logo.png`,
 * adaptando-se via `currentColor` tanto para o Dark Mode (#FFFFFF / #F7F8F8)
 * quanto para áreas claras e impressão A4 (#111111 / #000000), sem fundo quadrado.
 */
export function ObzaIcon({ className = 'w-5 h-5 text-[#FFFFFF]' }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="OBZA"
    >
      {/* Triângulo superior-esquerdo com canto arredondado */}
      <path
        d="M20.2 1.8L4.6 8.95C3.78 9.33 3.4 10.15 3.62 11.05L5.7 19.85L20.2 1.8Z"
        fill="currentColor"
      />
      {/* Triângulo inferior-direito com canto arredondado */}
      <path
        d="M19.85 4.25L5.35 22.2L18.55 16.45C19.38 16.08 19.75 15.26 19.55 14.36L19.85 4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Escrita tipográfica oficial "OBZA" acompanhando a estética geométrica
 * da nova logo (caixa alta sólida + letra 'O' com corte diagonal característico).
 */
export function ObzaWordmark({ className = 'h-3.5 w-auto text-current' }) {
  const maskId = React.useId();

  return (
    <svg
      viewBox="0 0 132 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="OBZA"
    >
      <defs>
        <mask id={maskId}>
          <rect width="132" height="32" fill="white" />
          {/* Corte diagonal na parte superior direita do 'O' */}
          <polygon points="15,17 28,0 32,2 16,18" fill="black" />
        </mask>
      </defs>

      {/* Letra O geométrica com corte diagonal */}
      <g mask={`url(#${maskId})`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 3C8.268 3 2 9.044 2 16.5C2 23.956 8.268 30 16 30C23.732 30 30 23.956 30 16.5C30 9.044 23.732 3 16 3ZM16 8.8C11.582 8.8 8 12.247 8 16.5C8 20.753 11.582 24.2 16 24.2C20.418 24.2 24 20.753 24 16.5C24 12.247 20.418 8.8 16 8.8Z"
          fill="currentColor"
        />
      </g>
      {/* Ponta agulha que entra no centro do 'O' */}
      <polygon points="13.5,18.5 24.5,6.2 26.2,7.7" fill="currentColor" />

      {/* Letra B */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36 3.5H51.2C56.4 3.5 59.8 6.1 59.8 10.2C59.8 12.9 58.2 14.9 55.7 15.8C58.8 16.6 60.8 18.9 60.8 22.1C60.8 26.7 57.1 29.5 51.3 29.5H36V3.5ZM42 8.7V14.1H50.1C52.4 14.1 53.8 12.9 53.8 11.3C53.8 9.7 52.4 8.7 50.1 8.7H42ZM42 18.8V24.3H50.7C53.3 24.3 54.8 23.2 54.8 21.5C54.8 19.8 53.3 18.8 50.7 18.8H42Z"
        fill="currentColor"
      />

      {/* Letra Z */}
      <path
        d="M65.5 3.5H91.5V8.4L73.6 24.1H91.8V29.5H64.8V24.6L82.7 8.9H65.5V3.5Z"
        fill="currentColor"
      />

      {/* Letra A */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M107.8 3.5H114.6L127.6 29.5H121L118.3 23.8H104.1L101.4 29.5H94.8L107.8 3.5ZM106.4 18.7H116L111.2 8.5L106.4 18.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Combinação oficial horizontal: Símbolo geométrico à esquerda + escrita OBZA ao lado.
 */
export function ObzaBrand({
  iconClassName = 'w-4 h-4',
  wordmarkClassName = 'h-3.5 w-auto',
  className = 'inline-flex items-center gap-2 text-[#FFFFFF]',
}) {
  return (
    <span className={className}>
      <ObzaIcon className={iconClassName} />
      <ObzaWordmark className={wordmarkClassName} />
    </span>
  );
}
