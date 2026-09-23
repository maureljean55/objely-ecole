const ORBIT_OBJECTS = [
  { id: "wallet", src: "/illustrations/splash/wallet.png", alt: "Portefeuille", angle: 0 },
  { id: "phone", src: "/illustrations/splash/phone.png", alt: "Téléphone", angle: 90 },
  { id: "keys", src: "/illustrations/splash/keys.png", alt: "Clés", angle: 180 },
  { id: "earbuds", src: "/illustrations/splash/earbuds.png", alt: "Écouteurs", angle: 270 },
] as const;

// The Objely app's splash, scaled ~1.4× to fill the panel: same gradient,
// same objects orbiting a pulsing magnifier.
const SCENE = 392;
const ORBIT_RADIUS = 168;
const OBJECT_SIZE = 78;

export function Hero() {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl shadow-sheet"
      style={{ background: "linear-gradient(135deg, #0058bc 0%, #0070eb 35%, #7c6ff0 70%, #a19afd 100%)" }}
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: SCENE, height: SCENE }}>
          {/* Radar pings behind the magnifier */}
          <span aria-hidden="true" className="radar-ping absolute size-[134px] rounded-full border border-blue-200/40" />
          <span
            aria-hidden="true"
            className="radar-ping absolute size-[134px] rounded-full border border-blue-200/40"
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
            className="magnifier-pulse pointer-events-none relative w-[180px] select-none"
          />
        </div>
      </div>

      <div className="splash-fade-up flex flex-col items-center pb-10" style={{ animationDelay: "0.15s" }}>
        <p className="text-h-lg font-bold tracking-tight text-white">Objely</p>
        <p className="mt-1 text-body-md font-medium text-white/90">Perdu. Trouvé. Retrouvé.</p>
      </div>
    </div>
  );
}
