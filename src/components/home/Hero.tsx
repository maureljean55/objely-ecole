const ORBIT_OBJECTS = [
  { id: "wallet", src: "/illustrations/splash/wallet.png", alt: "Portefeuille", angle: 0 },
  { id: "phone", src: "/illustrations/splash/phone.png", alt: "Téléphone", angle: 90 },
  { id: "keys", src: "/illustrations/splash/keys.png", alt: "Clés", angle: 180 },
  { id: "earbuds", src: "/illustrations/splash/earbuds.png", alt: "Écouteurs", angle: 270 },
] as const;

// The Objely app's splash, slightly smaller than the original (280px scene, 56px objects): same gradient,
// same objects orbiting a pulsing magnifier.
const SCENE = 270;
const ORBIT_RADIUS = 114;
const OBJECT_SIZE = 50;

export function Hero() {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl"
      style={{ background: "linear-gradient(135deg, #0058bc 0%, #0070eb 35%, #7c6ff0 70%, #a19afd 100%)" }}
    >
      {/* The app's tilted handwritten note, top right. White here: the app's blue-violet
          gradient text would vanish on this same gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-9 z-10 w-[200px] -rotate-[9deg] text-center text-white"
        style={{ fontFamily: "var(--font-caveat), cursive" }}
      >
        <svg className="absolute -left-9 -top-6 size-10" viewBox="0 0 20 20" fill="none">
          <path d="M18 18C18 8 12 2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p className="text-[27px] font-bold leading-[1.15] tracking-[0.2px] [text-shadow:0_1px_10px_rgba(0,40,120,0.25)]">
          Une petite aide
          <br />
          peut faire une
          <br />
          grande différence
        </p>
        <svg className="absolute -left-10 bottom-3 size-7" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <svg className="ml-auto mr-2 mt-1 block size-10" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20C12 20 3 14 3 8.5C3 5.5 5.3 3.5 8 3.5C9.8 3.5 11.2 4.5 12 5.8C12.8 4.5 14.2 3.5 16 3.5C18.7 3.5 21 5.5 21 8.5C21 14 12 20 12 20Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-1 items-center justify-center pt-24">
        <div className="relative flex items-center justify-center" style={{ width: SCENE, height: SCENE }}>
          {/* Radar pings behind the magnifier */}
          <span aria-hidden="true" className="radar-ping absolute size-[88px] rounded-full border border-blue-200/40" />
          <span
            aria-hidden="true"
            className="radar-ping absolute size-[88px] rounded-full border border-blue-200/40"
            style={{ animationDelay: "1.3s" }}
          />

          {/* Orbiting objects */}
          <div className="orbit-ring absolute inset-0">
            {ORBIT_OBJECTS.map((obj) => (
              <div
                key={obj.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: OBJECT_SIZE,
                  height: OBJECT_SIZE,
                  margin: `${-OBJECT_SIZE / 2}px 0 0 ${-OBJECT_SIZE / 2}px`,
                  transform: `rotate(${obj.angle}deg) translate(${ORBIT_RADIUS}px) rotate(-${obj.angle}deg)`,
                }}
              >
                <div className="orbit-item-inner flex size-full items-center justify-center drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={obj.src} alt={obj.alt} draggable={false} className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            ))}
          </div>

          {/* Magnifying glass */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/splash/magnifier.png"
            alt=""
            draggable={false}
            className="magnifier-pulse pointer-events-none relative w-[112px] select-none"
          />
        </div>
      </div>

      <div className="splash-fade-up flex flex-col items-center pb-10" style={{ animationDelay: "0.15s" }}>
        <p className="font-display text-h-lg font-extrabold text-white">Objely</p>
        <p className="mt-1 text-body-md font-medium text-white/90">Perdu. Trouvé. Retrouvé.</p>
      </div>
    </div>
  );
}
