/* ============================================
   CINEVERSE WATCH TOGETHER LOGIC
   ============================================ */

let currentWatchSession = null;
let watchSessionListener = null;

// === Session Management ===
async function inviteToWatch(friendId, movie) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const sessionRef = await db.collection('watch_sessions').add({
            hostId: user.uid,
            hostName: user.displayName || 'Friend',
            guestId: friendId,
            movieId: movie.id,
            movieTitle: movie.title,
            status: 'pending',
            isPlaying: true,
            currentTime: 0,
            timestamp: serverTimestamp()
        });
        
        showToast(`Invitation sent to watch "${movie.title}"!`);
        return sessionRef.id;
    } catch (e) {
        console.error("Watch Invite Error:", e);
    }
}

function listenForWatchRequests() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('watch_sessions')
        .where('guestId', '==', user.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    showWatchRequestToast(change.doc.id, data);
                }
            });
        });
}

function showWatchRequestToast(sessionId, data) {
    let toast = document.getElementById('watchRequestToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'watchRequestToast';
        toast.className = 'watch-request-toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="watch-request-content">
            <div class="watch-request-info">
                <p>${data.hostName} wants to watch with you!</p>
                <span>Movie: ${data.movieTitle}</span>
            </div>
        </div>
        <div class="watch-request-actions">
            <button class="watch-btn watch-accept-btn" onclick="acceptWatchInvite('${sessionId}')">Accept</button>
            <button class="watch-btn watch-decline-btn" onclick="declineWatchInvite('${sessionId}')">Decline</button>
        </div>
    `;

    setTimeout(() => toast.classList.add('active'), 100);
}

async function acceptWatchInvite(sessionId) {
    const toast = document.getElementById('watchRequestToast');
    toast.classList.remove('active');

    try {
        await db.collection('watch_sessions').doc(sessionId).update({
            status: 'active'
        });
        startWatchParty(sessionId);
    } catch (e) {
        console.error("Accept Invite Error:", e);
    }
}

async function declineWatchInvite(sessionId) {
    const toast = document.getElementById('watchRequestToast');
    toast.classList.remove('active');
    await db.collection('watch_sessions').doc(sessionId).delete();
}

// === Watch Party UI ===
function startWatchParty(sessionId) {
    const overlay = document.getElementById('watchPartyOverlay');
    if (!overlay) {
        createWatchPartyOverlay();
    }
    
    document.getElementById('watchPartyOverlay').classList.add('active');
    
    // Listen for session updates
    if (watchSessionListener) watchSessionListener();
    
    watchSessionListener = db.collection('watch_sessions').doc(sessionId)
        .onSnapshot(doc => {
            if (!doc.exists) {
                endWatchParty();
                return;
            }
            const data = doc.data();
            currentWatchSession = { id: doc.id, ...data };
            updateWatchPartyUI(data);
        });
}

function createWatchPartyOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'watchPartyOverlay';
    overlay.className = 'watch-party-overlay';
    
    overlay.innerHTML = `
        <div class="watch-party-header">
            <div style="display:flex; align-items:center; gap:15px;">
                <h3 id="wpMovieTitle" style="color:#fff; font-size:1.1rem;">Watching Movie</h3>
                <span class="sync-status-badge">LIVE SYNC ON</span>
            </div>
            <button class="nav-action-btn" onclick="endWatchParty()" title="Exit Room">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="watch-party-main">
            <div class="watch-party-player-container">
                <div id="wpPlayerWrapper" style="width:100%; height:100%;">
                    <iframe id="wpPlayerIframe" src="" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>
                </div>
                <div class="sync-controls">
                    <button class="sync-btn" onclick="syncPlayback('pause')">
                        <i class="fas fa-pause"></i> Pause for All
                    </button>
                    <button class="sync-btn" onclick="syncPlayback('play')">
                        <i class="fas fa-play"></i> Play for All
                    </button>
                </div>
            </div>
            <div class="watch-party-sidebar">
                <div class="watch-chat-messages" id="wpChatMessages"></div>
                <div class="watch-chat-input-area">
                    <input type="text" class="watch-chat-input" id="wpChatInput" placeholder="Chat with friend...">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Setup Chat Input
    document.getElementById('wpChatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendWatchChatMessage();
    });
}

function updateWatchPartyUI(data) {
    document.getElementById('wpMovieTitle').textContent = `Watching: ${data.movieTitle}`;
    
    const iframe = document.getElementById('wpPlayerIframe');
    const targetSrc = `https://autoembed.co/movie/tmdb/${data.movieId}`;
    
    if (iframe.src !== targetSrc) {
        iframe.src = targetSrc;
    }
}

async function syncPlayback(action) {
    if (!currentWatchSession) return;
    
    try {
        await db.collection('watch_sessions').doc(currentWatchSession.id).update({
            isPlaying: action === 'play',
            lastAction: action,
            actionTime: Date.now()
        });
        showToast(`Synced ${action} for both!`);
    } catch (e) {
        console.error("Sync Error:", e);
    }
}

function endWatchParty() {
    if (watchSessionListener) watchSessionListener();
    const overlay = document.getElementById('watchPartyOverlay');
    if (overlay) overlay.classList.remove('active');
    
    if (currentWatchSession) {
        db.collection('watch_sessions').doc(currentWatchSession.id).delete();
    }
    
    currentWatchSession = null;
}

async function sendWatchChatMessage() {
    const input = document.getElementById('wpChatInput');
    const text = input.value.trim();
    if (!text || !currentWatchSession) return;
    
    const user = auth.currentUser;
    const msg = {
        senderName: user.displayName || 'Me',
        text: text,
        timestamp: Date.now()
    };
    
    try {
        // We append chat to the session doc for simplicity in this version
        const chatMsgs = document.getElementById('wpChatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.style.padding = '8px 12px';
        msgDiv.style.background = 'rgba(255,255,255,0.05)';
        msgDiv.style.borderRadius = '10px';
        msgDiv.style.color = '#fff';
        msgDiv.style.fontSize = '0.85rem';
        msgDiv.innerHTML = `<strong>${msg.senderName}:</strong> ${msg.text}`;
        chatMsgs.appendChild(msgDiv);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        
        input.value = '';
        
        // Actually sync the chat message via Firestore
        await db.collection('watch_sessions').doc(currentWatchSession.id).collection('messages').add(msg);
    } catch (e) {
        console.error("Chat Sync Error:", e);
    }
}
