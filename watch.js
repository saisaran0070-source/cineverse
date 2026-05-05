/* ============================================
   CINEVERSE WATCH TOGETHER LOGIC
   ============================================ */

let currentWatchSession = null;
let watchSessionListener = null;
let currentPendingMovie = null;

// === Initialization ===
function initWatchSystem() {
    console.log("📺 Watch System Initializing...");
    setupWatchEventListeners();
    listenForWatchRequests();
}

function setupWatchEventListeners() {
    // Detail Modal Watch Together Button
    const wtBtn = document.getElementById('detailWatchTogetherBtn');
    if (wtBtn) {
        wtBtn.addEventListener('click', () => {
            const movieTitle = document.getElementById('detailTitle').textContent;
            // Get the current movie ID from the app state if possible, or from the detail modal context
            // We'll store it when showMovieDetail is called
            openFriendSelector(currentPendingMovie || { title: movieTitle });
        });
    }

    // Friend Selector Close
    const closeFsBtn = document.getElementById('closeFriendSelectorBtn');
    if (closeFsBtn) {
        closeFsBtn.addEventListener('click', () => {
            document.getElementById('friendSelectorModal').classList.remove('active');
        });
    }

    // Friend Search Input
    const fsInput = document.getElementById('friendSearchInput');
    if (fsInput) {
        let debounceTimer;
        fsInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = fsInput.value.trim();
            if (query.length < 2) return;
            debounceTimer = setTimeout(() => searchFriendsForWatch(query), 400);
        });
    }
}

// === Friend Selection ===
function openFriendSelector(movie) {
    currentPendingMovie = movie;
    const modal = document.getElementById('friendSelectorModal');
    const targetText = document.getElementById('watchTargetMovieName');
    
    if (targetText) targetText.textContent = `To watch "${movie.title}" with you`;
    if (modal) modal.classList.add('active');
    
    const results = document.getElementById('friendSearchResults');
    if (results) results.innerHTML = '<div style="padding: 20px; color: rgba(255,255,255,0.3); font-size: 0.8rem;">Type a name to find friends...</div>';
    
    const input = document.getElementById('friendSearchInput');
    if (input) {
        input.value = '';
        input.focus();
    }
}

async function searchFriendsForWatch(query) {
    const resultsContainer = document.getElementById('friendSearchResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--accent-primary); font-size: 0.8rem;"><i class="fas fa-circle-notch fa-spin"></i> Searching...</div>';

    try {
        const snapshot = await db.collection('users')
            .where('displayName', '>=', query)
            .where('displayName', '<=', query + '\uf8ff')
            .limit(5)
            .get();

        if (snapshot.empty) {
            resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 0.8rem;">No members found</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const uid = doc.id;
            if (uid === auth.currentUser?.uid) return;

            const el = document.createElement('div');
            el.className = 'user-result-item';
            el.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px; cursor:pointer; transition:all 0.2s;';
            el.onmouseover = () => el.style.background = 'rgba(255,255,255,0.08)';
            el.onmouseout = () => el.style.background = 'rgba(255,255,255,0.03)';

            const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`;
            
            el.innerHTML = `
                <img src="${avatar}" style="width:35px; height:35px; border-radius:50%; border:1px solid var(--accent-primary);">
                <div style="flex:1; text-align:left;">
                    <div style="color:#fff; font-size:0.85rem; font-weight:600;">${user.displayName || 'User'}</div>
                    <div style="color:var(--text-muted); font-size:0.7rem;">Click to invite</div>
                </div>
                <i class="fas fa-paper-plane" style="color:var(--accent-primary); font-size:0.8rem;"></i>
            `;
            
            el.addEventListener('click', () => {
                inviteToWatch(uid, currentPendingMovie, user.displayName);
                document.getElementById('friendSelectorModal').classList.remove('active');
                if (document.getElementById('detailModal')) document.getElementById('detailModal').classList.remove('active');
            });
            
            resultsContainer.appendChild(el);
        });
    } catch (e) {
        console.error("Friend Search Error:", e);
    }
}

// === Session Management ===
async function inviteToWatch(friendId, movie, friendName) {
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
        
        showToast(`Invitation sent to ${friendName || 'friend'}!`);
        // JOIN ROOM IMMEDIATELY (Waiting state)
        startWatchParty(sessionRef.id);
    } catch (e) {
        console.error("Watch Invite Error:", e);
        showToast("Failed to send invitation.");
    }
}

function listenForWatchRequests() {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Listen for invitations SENT TO ME (Guest side)
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
        }, err => console.error("Guest listener error:", err));

    // 2. Listen for invitations I SENT (Host side - to auto-start when they accept)
    db.collection('watch_sessions')
        .where('hostId', '==', user.uid)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const sessionId = change.doc.id;
                
                // If friend accepted, force open the room if not already in it
                if (data.status === 'active' && !document.getElementById('watchPartyOverlay')?.classList.contains('active')) {
                    console.log("Friend accepted! Launching theater...");
                    startWatchParty(sessionId);
                }
                
                // If friend declined or session ended
                if (change.type === 'removed') {
                    if (currentWatchSession?.id === sessionId) {
                        showToast("Watch session ended.");
                        endWatchParty();
                    }
                }
            });
        }, err => console.error("Host listener error:", err));
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
    if (toast) toast.classList.remove('active');

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
    if (toast) toast.classList.remove('active');
    await db.collection('watch_sessions').doc(sessionId).delete();
}

// === Watch Party Room ===
function startWatchParty(sessionId) {
    const overlay = document.getElementById('watchPartyOverlay');
    if (!overlay) {
        createWatchPartyOverlay();
    }
    
    document.getElementById('watchPartyOverlay').classList.add('active');
    
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
                <h3 id="wpMovieTitle" style="color:#fff; font-size:1.1rem; margin:0;">Watching Movie</h3>
                <span class="sync-status-badge" id="wpSyncStatus">WAITING FOR FRIEND...</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="nav-action-btn" id="wpFullscreenBtn" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="nav-action-btn" onclick="endWatchParty()" title="Exit Room">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="watch-party-main">
            <div class="watch-party-player-container" id="wpPlayerContainer">
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
                    <input type="text" class="watch-chat-input" id="wpChatInput" placeholder="Type a message...">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('wpChatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendWatchChatMessage();
    });

    // Fullscreen Logic for Watch Party
    document.getElementById('wpFullscreenBtn').addEventListener('click', () => {
        const container = document.getElementById('wpPlayerContainer');
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                showToast("Fullscreen not supported for this player.");
            });
        } else {
            document.exitFullscreen();
        }
    });
}

function updateWatchPartyUI(data) {
    document.getElementById('wpMovieTitle').textContent = `Watching: ${data.movieTitle}`;
    const statusBadge = document.getElementById('wpSyncStatus');
    if (data.status === 'active') {
        statusBadge.textContent = 'LIVE SYNC ON';
        statusBadge.style.background = 'rgba(0, 245, 212, 0.1)';
        statusBadge.style.color = '#00f5d4';
    } else {
        statusBadge.textContent = 'WAITING FOR FRIEND...';
        statusBadge.style.background = 'rgba(255, 107, 53, 0.1)';
        statusBadge.style.color = '#ff6b35';
    }

    const iframe = document.getElementById('wpPlayerIframe');
    const targetSrc = `https://autoembed.co/movie/tmdb/${data.movieId}`;
    if (iframe.src !== targetSrc) iframe.src = targetSrc;
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
    if (currentWatchSession) db.collection('watch_sessions').doc(currentWatchSession.id).delete();
    currentWatchSession = null;
}

async function sendWatchChatMessage() {
    const input = document.getElementById('wpChatInput');
    const text = input.value.trim();
    if (!text || !currentWatchSession) return;
    
    const user = auth.currentUser;
    const msg = {
        senderName: user.displayName || 'User',
        text: text,
        timestamp: Date.now()
    };
    
    try {
        const chatMsgs = document.getElementById('wpChatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.style.padding = '8px 12px';
        msgDiv.style.background = 'rgba(255,255,255,0.05)';
        msgDiv.style.borderRadius = '10px';
        msgDiv.style.color = '#fff';
        msgDiv.style.fontSize = '0.8rem';
        msgDiv.innerHTML = `<strong>${msg.senderName}:</strong> ${msg.text}`;
        chatMsgs.appendChild(msgDiv);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        input.value = '';
        await db.collection('watch_sessions').doc(currentWatchSession.id).collection('messages').add(msg);
    } catch (e) {
        console.error("Chat Error:", e);
    }
}

// Global hook for app.js
window.setCurrentWatchMovie = (movie) => {
    currentPendingMovie = movie;
};
