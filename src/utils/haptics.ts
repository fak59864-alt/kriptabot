declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged?: () => void;
        };
      };
    };
  }
}

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

export function setMuted(muted: boolean) {
  isAudioMuted = muted;
}

export function getMuted(): boolean {
  return isAudioMuted;
}

function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainVal = 0.03) {
  if (isAudioMuted || typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Ignore audio context errors on restricted autoplay
  }
}

export function triggerHaptic(
  kind: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'
) {
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (hf) {
      if (kind === 'selection') {
        hf.selectionChanged?.();
      } else if (kind === 'success' || kind === 'warning' || kind === 'error') {
        hf.notificationOccurred?.(kind);
      } else {
        hf.impactOccurred?.(kind);
      }
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (kind === 'error' || kind === 'heavy') navigator.vibrate([25, 30, 25]);
      else if (kind === 'selection' || kind === 'light') navigator.vibrate(6);
      else navigator.vibrate(12);
    }
  } catch {
    // Safe fallback
  }

  // Subtle iOS-like audio feedback
  if (kind === 'light' || kind === 'selection') {
    playTone(540, 35, 'sine', 0.018);
  } else if (kind === 'medium') {
    playTone(420, 55, 'triangle', 0.025);
  } else if (kind === 'success') {
    playTone(660, 75, 'sine', 0.03);
    setTimeout(() => playTone(880, 95, 'sine', 0.03), 65);
  } else if (kind === 'warning') {
    playTone(310, 110, 'sawtooth', 0.025);
  } else if (kind === 'error' || kind === 'heavy') {
    playTone(190, 160, 'sawtooth', 0.035);
  }
}

export function initTelegramWebApp() {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {
    // Running in browser outside Telegram
  }
}
