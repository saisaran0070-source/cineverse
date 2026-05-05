/* ============================================
   CINEVERSE CHAT LOGIC (FIRESTORE REAL-TIME)
   ============================================ */

const Chat = {
    currentChatId: null,
    unsubscribeMessages: null,
    unsubscribeConversations: null,

    init() {
        this.setupEventListeners();
        this.listenForAuth();
    },

    listenForAuth() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.loadConversations();
            } else {
                if (this.unsubscribeConversations) this.unsubscribeConversations();
            }
        });
    },

    setupEventListeners() {
        const floatBtn = document.getElementById('chatFloatBtn');
        const panel = document.getElementById('chatPanel');
        const closeBtn = document.getElementById('closeChatBtn');
        const backBtn = document.getElementById('chatBackBtn');
        const inputForm = document.getElementById('chatInputForm');

        floatBtn.addEventListener('click', () => {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) this.showListView();
        });

        closeBtn.addEventListener('click', () => panel.classList.remove('active'));

        backBtn.addEventListener('click', () => this.showListView());

        inputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
    },

    showListView() {
        document.getElementById('chatList').style.display = 'block';
        document.getElementById('chatView').style.display = 'none';
        document.getElementById('chatBackBtn').style.display = 'none';
        document.getElementById('chatHeaderTitle').textContent = "Messages";
        this.currentChatId = null;
        if (this.unsubscribeMessages) this.unsubscribeMessages();
    },

    showChatView(chatId, otherUserName) {
        document.getElementById('chatList').style.display = 'none';
        document.getElementById('chatView').style.display = 'flex';
        document.getElementById('chatBackBtn').style.display = 'block';
        document.getElementById('chatHeaderTitle').textContent = otherUserName;
        this.currentChatId = chatId;
        this.loadMessages(chatId);
        this.markAsRead(chatId);
    },

    getChatId(uid1, uid2) {
        return [uid1, uid2].sort().join('_');
    },

    // Global function to start chat from profile
    initChatWith(otherUid, otherName) {
        const myUid = auth.currentUser.uid;
        const chatId = this.getChatId(myUid, otherUid);
        
        // Open panel
        document.getElementById('chatPanel').classList.add('active');
        this.showChatView(chatId, otherName);
    },

    loadConversations() {
        const myUid = auth.currentUser.uid;
        this.unsubscribeConversations = db.collection('chats')
            .where('participants', 'array-contains', myUid)
            .orderBy('lastMessageTime', 'desc')
            .onSnapshot(snapshot => {
                const listContainer = document.getElementById('chatList');
                let totalUnread = 0;

                if (snapshot.empty) {
                    listContainer.innerHTML = `
                        <div class="chat-item-empty" style="padding: 40px; text-align: center; color: rgba(255,255,255,0.4);">
                            <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                            <p>No messages yet.<br>Start a chat from a user's profile!</p>
                        </div>
                    `;
                    this.updateBadge(0);
                    return;
                }

                listContainer.innerHTML = '';
                snapshot.forEach(doc => {
                    const chat = doc.data();
                    const otherUid = chat.participants.find(id => id !== myUid);
                    
                    // Count unread if last message was NOT from me
                    if (chat.unreadCount > 0 && chat.lastSenderId !== myUid) {
                        totalUnread += chat.unreadCount;
                    }

                    this.renderChatItem(doc.id, chat, otherUid);
                });

                this.updateBadge(totalUnread);
            });
    },

    async renderChatItem(chatId, chat, otherUid) {
        const listContainer = document.getElementById('chatList');
        const userDoc = await db.collection('users').doc(otherUid).get();
        const userData = userDoc.exists ? userDoc.data() : { displayName: 'User' };

        const item = document.createElement('div');
        item.className = `chat-item ${chat.unreadCount > 0 && chat.lastSenderId !== auth.currentUser.uid ? 'unread' : ''}`;
        
        const avatar = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=random`;
        const time = chat.lastMessageTime ? this.formatTime(chat.lastMessageTime.toDate()) : '';

        item.innerHTML = `
            <img src="${avatar}" class="chat-item-avatar">
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${userData.displayName}</span>
                    <span class="chat-item-time">${time}</span>
                </div>
                <div class="chat-item-preview">${chat.lastMessage || 'No messages yet'}</div>
            </div>
        `;

        item.addEventListener('click', () => this.showChatView(chatId, userData.displayName));
        listContainer.appendChild(item);
    },

    loadMessages(chatId) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '<div style="text-align:center; padding: 20px; opacity: 0.5;">Loading messages...</div>';

        if (this.unsubscribeMessages) this.unsubscribeMessages();

        this.unsubscribeMessages = db.collection('chats').doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    this.renderMessage(msg);
                });
                container.scrollTop = container.scrollHeight;
            });
    },

    renderMessage(msg) {
        const container = document.getElementById('messagesContainer');
        const isMe = msg.senderId === auth.currentUser.uid;
        
        const div = document.createElement('div');
        div.className = `message ${isMe ? 'message-sent' : 'message-received'}`;
        
        const time = msg.timestamp ? this.formatTime(msg.timestamp.toDate()) : '';
        
        div.innerHTML = `
            ${msg.text}
            <span class="message-time">${time}</span>
        `;
        
        container.appendChild(div);
    },

    async handleSendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text || !this.currentChatId) return;

        input.value = '';
        const myUid = auth.currentUser.uid;
        const chatId = this.currentChatId;

        const messageData = {
            senderId: myUid,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Add message
            await db.collection('chats').doc(chatId).collection('messages').add(messageData);

            // Update chat meta
            const participants = chatId.split('_');
            await db.collection('chats').doc(chatId).set({
                participants: participants,
                lastMessage: text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastSenderId: myUid,
                unreadCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

        } catch (error) {
            console.error("Send error:", error);
            showToast("Failed to send message");
        }
    },

    async markAsRead(chatId) {
        const doc = await db.collection('chats').doc(chatId).get();
        if (doc.exists && doc.data().lastSenderId !== auth.currentUser.uid) {
            await db.collection('chats').doc(chatId).set({
                unreadCount: 0
            }, { merge: true });
        }
    },

    updateBadge(count) {
        const badge = document.getElementById('chatBadge');
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const day = 24 * 60 * 60 * 1000;

        if (diff < day && now.getDate() === date.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < day * 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
};

// Global hook for app.js
window.initChatWith = (uid, name) => Chat.initChatWith(uid, name);

// Initialize
document.addEventListener('DOMContentLoaded', () => Chat.init());
