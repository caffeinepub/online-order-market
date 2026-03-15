import { useEffect, useRef, useState } from "react";

export function playSound(soundId: string): void {
  try {
    const ctx = new AudioContext();

    if (soundId === "bell") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      osc.onended = () => ctx.close();
    } else if (soundId === "chime") {
      const frequencies = [1046, 1318];
      let ended = 0;
      for (const freq of frequencies) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        osc.onended = () => {
          ended++;
          if (ended === frequencies.length) ctx.close();
        };
      }
    } else if (soundId === "ding") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => ctx.close();
    } else if (soundId === "alert") {
      // Two beeps at 600Hz, square, each 0.15s with 0.1s gap
      let ended = 0;
      const beepCount = 2;
      for (let i = 0; i < beepCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        const start = ctx.currentTime + i * 0.25;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.setValueAtTime(0.3, start + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.start(start);
        osc.stop(start + 0.15);
        osc.onended = () => {
          ended++;
          if (ended === beepCount) ctx.close();
        };
      }
    }
  } catch {
    // AudioContext not available
  }
}

export function useOrderNotification(
  orders: unknown[] | undefined,
  isOnOrdersTab: boolean,
) {
  const [hasUnread, setHasUnread] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    const count = orders?.length ?? 0;
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      setHasUnread(true);
      const sound = localStorage.getItem("notifSound") ?? "bell";
      playSound(sound);
    }
    prevCountRef.current = count;
  }, [orders]);

  useEffect(() => {
    if (isOnOrdersTab) {
      setHasUnread(false);
    }
  }, [isOnOrdersTab]);

  return { hasUnread, setHasUnread };
}
