/**
 * Three fixed-position layers that sit behind everything and give the
 * whole site its atmospheric look:
 *
 *  - bg-gradient: violet/indigo/pink radial blooms — the "aurora".
 *  - bg-grid:     faint dotted grid, masked to a soft elliptical center
 *                 so it doesn't compete with the content.
 *  - bg-noise:    inline SVG fractal noise at 4% opacity — kills the
 *                 banding you get on cheap monitors and gives the
 *                 gradients a tactile grain.
 *
 * All three are pointer-events:none so they never intercept clicks.
 */
export function BackgroundLayers() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(168, 85, 247, 0.25), transparent 60%)',
            'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(99, 102, 241, 0.18), transparent 60%)',
            'radial-gradient(ellipse 50% 50% at 20% 40%, rgba(236, 72, 153, 0.08), transparent 60%)',
          ].join(','),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  )
}
