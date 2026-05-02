/**
 * CineVerse - Interactive UI Sounds
 * Uses the Web Audio API to synthesize futuristic, lightweight UI sounds.
 * No external audio files required!
 */

let audioCtx = null;
let audioUnlocked = false;

// Initialize the AudioContext lazily on first user interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    audioUnlocked = true;
}

// Subtle, futuristic "swoosh" sound for hovering
function playHoverSound() {
    if (!audioUnlocked || !audioCtx) return;
    
    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Very fast, high-pitched sine wave sweeping down
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        
        // Extremely quiet volume curve
        gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Ignore audio errors
    }
}

// Sharp, high-tech "click" sound for clicking
function playClickSound() {
    if (!audioUnlocked || !audioCtx) return;
    
    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Triangle wave for a more distinct "tick"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        
        // Slightly louder than hover
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Ignore audio errors
    }
}

// === Event Listeners for Automatic Sounds ===

// Unlock audio context on the first click/touch anywhere on the page
document.addEventListener('mousedown', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

// Listen for hovering over interactive elements
let lastHoveredElement = null;
document.addEventListener('mouseover', (e) => {
    // Define which elements should trigger the hover sound
    const interactiveTarget = e.target.closest('.movie-card, .nav-item, button, .server-btn, .login-btn, .action-btn');
    
    if (interactiveTarget && interactiveTarget !== lastHoveredElement) {
        playHoverSound();
        lastHoveredElement = interactiveTarget;
    } else if (!interactiveTarget) {
        lastHoveredElement = null;
    }
});

// Listen for clicking on interactive elements
document.addEventListener('mousedown', (e) => {
    const interactiveTarget = e.target.closest('.movie-card, .nav-item, button, .server-btn, .login-btn, .action-btn');
    if (interactiveTarget) {
        playClickSound();
    }
});
