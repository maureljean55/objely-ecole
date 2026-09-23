import Image from "next/image";

// The real Objely mark: two interlocked rings. Native ratio is 1235:1087.
const RATIO = 1235 / 1087;

export function LogoMark({
  height,
  className = "",
  priority = false,
}: {
  height: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * RATIO);
  return (
    <Image
      src="/logo/objely-mark.png"
      alt=""
      width={width}
      height={height}
      priority={priority}
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
      style={{ width, height }}
    />
  );
}
