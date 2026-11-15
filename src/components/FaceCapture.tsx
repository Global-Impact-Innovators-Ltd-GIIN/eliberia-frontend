"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Remote face capture with a basic liveness challenge: the user is asked to turn their head, and we
 * measure frame-to-frame movement between two captures. This is a lightweight placeholder signal - a
 * production deployment must use a certified liveness/face-match provider on the server.
 */
export default function FaceCapture({ onCapture }: { onCapture: (blob: Blob, liveness: number) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  async function start() {
    setMsg("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      setStream(s);
      if (video.current) { video.current.srcObject = s; await video.current.play(); }
    } catch {
      setMsg("Camera access was denied or is unavailable. Allow camera access or book a service center visit.");
    }
  }

  const grab = () => {
    const v = video.current!;
    const c = document.createElement("canvas");
    c.width = 160; c.height = 120;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return { data: ctx.getImageData(0, 0, c.width, c.height).data, full: () => {
      const f = document.createElement("canvas"); f.width = v.videoWidth; f.height = v.videoHeight;
      f.getContext("2d")!.drawImage(v, 0, 0);
      return new Promise<Blob>((res) => f.toBlob((b) => res(b!), "image/jpeg", 0.9));
    } };
  };

  async function capture() {
    if (!video.current || !stream) return;
    setBusy(true);
    setMsg("Look straight at the camera...");
    await new Promise((r) => setTimeout(r, 1200));
    const a = grab();
    setMsg("Now slowly turn your head to the left...");
    await new Promise((r) => setTimeout(r, 2000));
    const b = grab();
    let diff = 0;
    for (let i = 0; i < a.data.length; i += 4) diff += Math.abs(a.data[i] - b.data[i]);
    const movement = diff / (a.data.length / 4) / 255; // 0..1
    const liveness = Math.min(1, movement * 12);
    const blob = await a.full();
    setBusy(false);
    if (liveness < 0.5) { setMsg("We did not detect movement. Please try again and turn your head."); return; }
    setMsg("Captured.");
    onCapture(blob, Number(liveness.toFixed(2)));
  }

  return (
    <div className="space-y-3">
      <video ref={video} playsInline muted className="aspect-[4/3] w-full max-w-sm rounded-lg bg-slate-900" />
      <div className="flex gap-2">
        {!stream ? <button type="button" className="btn" onClick={start}>Turn on camera</button>
          : <button type="button" className="btn btn-red" onClick={capture} disabled={busy}>{busy ? "Capturing..." : "Capture & verify"}</button>}
      </div>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </div>
  );
}
