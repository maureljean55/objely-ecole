"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../kiosk/Button";
import { Icon } from "../kiosk/Icon";
import { encodePhoto } from "@/lib/photo";

const OUTPUT = { width: 1024, height: 768 } as const; // 4:3

type Phase = "starting" | "live" | "unavailable";

// Sheet with a live preview of the borne's own camera and a single capture
// button. The shot is cropped to 4:3 and compressed on the spot so a few
// photos stay small enough to keep in the session draft.
export function CameraSheet({
  title,
  onCapture,
  onClose,
}: {
  title: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase("live");
      } catch {
        if (!cancelled) setPhase("unavailable");
      }
    }
    void start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // Centre-crop the video frame to 4:3.
    const targetRatio = OUTPUT.width / OUTPUT.height;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    if (sw / sh > targetRatio) sw = sh * targetRatio;
    else sh = sw / targetRatio;
    const sx = (video.videoWidth - sw) / 2;
    const sy = (video.videoHeight - sh) / 2;
    // Encoded to fit the database's size limit: a detailed or dark shot is otherwise refused at submit.
    const data = encodePhoto(OUTPUT.width, OUTPUT.height, (ctx, w, h) => ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h));
    if (data) onCapture(data);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-title"
      className="absolute inset-0 z-40 flex items-center justify-center bg-ink/60"
    >
      <div className="flex w-[600px] flex-col gap-4 rounded-card border-2 border-ink bg-white p-6 shadow-sheet">
        <div className="flex items-center justify-between">
          <h2 id="camera-title" className="text-h-lg text-ink">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fermer la caméra"
            onClick={onClose}
            className="press flex size-[52px] items-center justify-center rounded-xl border-2 border-line-strong text-ink"
          >
            <Icon name="close" size={26} />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink">
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
          {phase !== "live" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas px-10 text-center">
              {phase === "starting" ? (
                <p className="text-body-lg font-medium text-slate">Activation de la caméra…</p>
              ) : (
                <>
                  <Icon name="videocam_off" size={40} className="text-danger" />
                  <p className="text-h-md text-ink">La caméra n&apos;est pas disponible</p>
                  <p className="text-body-md text-slate">
                    Autorisez l&apos;accès à la caméra dans les réglages de la borne, ou scannez le QR code avec votre
                    téléphone pour ajouter la photo.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={onClose} className="!px-7">
            Annuler
          </Button>
          <button
            type="button"
            aria-label="Prendre la photo"
            disabled={phase !== "live"}
            onClick={capture}
            className="press flex size-20 items-center justify-center rounded-full border-4 border-ink bg-white disabled:opacity-40"
          >
            <span className="size-[56px] rounded-full bg-accent" />
          </button>
          <span className="w-[132px]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
