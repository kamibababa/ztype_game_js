export function createAudioController(muteBtn) {
  const audioState = {
    context: null,
    masterGain: null,
    unlocked: false,
    muted: false
  };

  function ensureAudioContext() {
    if (!audioState.context) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      audioState.context = new AudioCtx();
      audioState.masterGain = audioState.context.createGain();
      audioState.masterGain.gain.value = audioState.muted ? 0 : 0.18;
      audioState.masterGain.connect(audioState.context.destination);
    }
    return audioState.context;
  }

  function unlockAudio() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      context.resume();
    }
    audioState.unlocked = true;
  }

  function playTone(freq, durationSec, type, gainValue, whenOffsetSec) {
    if (audioState.muted) {
      return;
    }
    const context = ensureAudioContext();
    if (!context || !audioState.unlocked || !audioState.masterGain) {
      return;
    }

    const start = context.currentTime + (whenOffsetSec || 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainValue || 0.08), start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    oscillator.connect(gain);
    gain.connect(audioState.masterGain);

    oscillator.start(start);
    oscillator.stop(start + durationSec + 0.015);
  }

  function playShotSound() {
    playTone(760, 0.055, "triangle", 0.055, 0);
  }

  function playKillSound() {
    playTone(520, 0.08, "square", 0.08, 0);
    playTone(860, 0.1, "triangle", 0.06, 0.03);
  }

  function playDamageSound() {
    playTone(190, 0.13, "sawtooth", 0.09, 0);
  }

  function playGameOverSound() {
    playTone(340, 0.12, "triangle", 0.07, 0);
    playTone(260, 0.16, "triangle", 0.07, 0.1);
    playTone(180, 0.22, "triangle", 0.08, 0.22);
  }

  function updateMuteButtonLabel() {
    muteBtn.textContent = audioState.muted ? "🔇 音效关" : "🔊 音效开";
  }

  function toggleMute() {
    audioState.muted = !audioState.muted;
    if (audioState.masterGain) {
      audioState.masterGain.gain.value = audioState.muted ? 0 : 0.18;
    }
    updateMuteButtonLabel();
  }

  return {
    unlockAudio,
    toggleMute,
    updateMuteButtonLabel,
    playShotSound,
    playKillSound,
    playDamageSound,
    playGameOverSound
  };
}
