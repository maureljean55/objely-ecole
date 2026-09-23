import { Icon } from "../kiosk/Icon";
import { LogoMark } from "../kiosk/LogoMark";

function Chip({ icon, iconClass, fill, className, children }: {
  icon: string;
  iconClass: string;
  fill?: boolean;
  className: string;
  children: string;
}) {
  return (
    <div className={`absolute z-20 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-rest ring-1 ring-line ${className}`}>
      <Icon name={icon} size={18} fill={fill} className={iconClass} />
      <span className="text-label-sm text-ink">{children}</span>
    </div>
  );
}

// The two interlocked rings are the brand: a lost thing and its owner, linked.
// They sit on a soft disc; the objects that get lost orbit around them.
export function Hero() {
  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl border border-white bg-[linear-gradient(160deg,#eaf4ff_0%,#f0ebff_100%)] p-6 shadow-rest">
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-blue-light/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-16 size-64 rounded-full bg-purple-light/30 blur-3xl" />

      <div className="z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 shadow-rest">
        <Icon name="auto_awesome" size={18} fill className="text-blue-ink" />
        <span className="text-label-sm uppercase tracking-wide text-blue-ink">Service scolaire intelligent</span>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        <Chip icon="check_circle" fill iconClass="text-ok-ink" className="left-1 top-10 animate-float [animation-duration:5s]">
          Retrouvé !
        </Chip>
        <Chip icon="qr_code" iconClass="text-purple-ink" className="-right-1 top-[46%]">
          Scan QR
        </Chip>
        <Chip icon="verified" fill iconClass="text-blue-ink" className="bottom-10 left-8">
          Sécurisé
        </Chip>

        <div className="relative flex size-[300px] items-center justify-center">
          <div aria-hidden="true" className="absolute inset-0 rounded-full border border-white/80" />
          <div aria-hidden="true" className="absolute inset-9 rounded-full border border-white/90" />
          <div className="relative flex size-[214px] items-center justify-center rounded-full bg-white shadow-sheet">
            <LogoMark height={112} priority className="animate-float" />
            <div className="absolute -right-3 -top-3 flex size-16 -rotate-12 items-center justify-center rounded-2xl bg-white text-blue-ink shadow-sheet ring-1 ring-line">
              <Icon name="smartphone" size={32} />
            </div>
            <div className="absolute -bottom-2 -left-4 flex size-14 rotate-12 items-center justify-center rounded-2xl bg-purple text-white shadow-sheet">
              <Icon name="key" fill size={28} />
            </div>
          </div>
        </div>
      </div>

      <p className="z-10 rounded-xl bg-white/85 px-4 py-2 text-body-md font-medium text-slate">
        Plateforme connectée des objets trouvés du lycée
      </p>
    </div>
  );
}
