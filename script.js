let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || {
    world: [],
    russia: [],
    usa: []
};
let privateMessages = JSON.parse(localStorage.getItem('privateMessages')) || {};
let privateChats = JSON.parse(localStorage.getItem('privateChats')) || [];
let starredMessages = JSON.parse(localStorage.getItem('starredMessages')) || [];

let currentUser = null;
let currentChannel = 'world';
let currentPrivateUser = null;
let currentStarredView = false;
let invisibleMode = false;

document.addEventListener('DOMContentLoaded', function() {
    init();
});

const disclaimerText = {
    russia: `LEGAL DISCLAIMER - RUSSIAN FEDERATION

This platform operates in full compliance with the legislation of the Russian Federation:

1. Federal Law No. 149-FZ "On Information, Information Technologies and Information Protection"
   - Article 10.1: This service does not collect, store, or process personal data
   - Article 15.3: No user identification or verification is performed
   - No IP addresses, device fingerprints, or metadata are logged

2. Federal Law No. 152-FZ "On Personal Data"
   - Article 2: This system operates without processing personal data
   - All credentials are stored locally on user's device
   - No data transmission across state borders

3. Federal Law No. 114-FZ "On Countering Extremist Activity"
   - This platform does not moderate content
   - Users are solely responsible for their messages
   - No endorsement or dissemination of illegal materials

This is a client-side application. All data remains in your browser's localStorage. Absolutely no data is transmitted to any server. The creator of this software is not responsible for user-generated content.

By using this service, you confirm that you are 18+ years of age.`,

    usa: `LEGAL DISCLAIMER - UNITED STATES

This platform complies with United States federal laws:

1. Section 230 of the Communications Decency Act (47 U.S.C. § 230)
   - This service is an interactive computer service provider
   - Not treated as publisher or speaker of user-generated content
   - Good faith content moderation immunity

2. Electronic Communications Privacy Act (18 U.S.C. § 2510)
   - No interception of electronic communications
   - All messages are stored locally only
   - No third-party access to communications

3. Federal Trade Commission Act (15 U.S.C. § 45)
   - Complete transparency: zero data collection
   - No deceptive practices
   - No commercial purpose

4. CALEA (Communications Assistance for Law Enforcement Act)
   - This system is not a telecommunications carrier
   - No capability for lawful interception
   - No data retention obligations

This is a fully client-side application. Zero data transmission occurs. All messages and credentials exist only in your browser's localStorage. No servers, no databases, no tracking.

User must be 18+ to use this service.`
};

function init() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showAuth();
    setupEventListeners();
}

function showAuth() {
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    if (authContainer) authContainer.classList.add('active');
    if (mainContainer) mainContainer.classList.remove('active');
}

function showMain() {
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    if (authContainer) authContainer.classList.remove('active');
    if (mainContainer) mainContainer.classList.add('active');
    
    const usernameEl = document.getElementById('current-username');
    if (usernameEl && currentUser) usernameEl.textContent = currentUser.username;
    
    updateBadge();
    renderPrivateChannels();
    renderStarredList();
}

function register() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        showMessage('fields cannot be empty');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        showMessage('username taken');
        return;
    }
    
    const newUser = {
        username,
        password,
        messagesCount: 0,
        registered: Date.now()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = JSON.parse(JSON.stringify(newUser));
    
    showMain();
}

function login() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = JSON.parse(JSON.stringify(user));
        showMain();
    } else {
        showMessage('invalid username or password');
    }
}

function sendMessage() {
    if (!currentUser) return;
    if (currentChannel === 'disclaimer') return;
    if (currentStarredView) return;
    
    const input = document.getElementById('message-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    if (currentPrivateUser) {
        sendPrivateMessage(currentPrivateUser, text);
    } else {
        sendPublicMessage(text);
    }
    
    input.value = '';
    renderMessages();
}

function sendPublicMessage(text) {
    const message = {
        id: Date.now() + Math.random(),
        username: invisibleMode ? 'anonymous' : currentUser.username,
        originalUsername: invisibleMode ? currentUser.username : null,
        text: text,
        timestamp: Date.now(),
        channel: currentChannel,
        invisible: invisibleMode
    };
    
    messages[currentChannel].push(message);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    if (!invisibleMode) {
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex].messagesCount++;
            currentUser.messagesCount = users[userIndex].messagesCount;
            localStorage.setItem('users', JSON.stringify(users));
            updateBadge();
        }
    }
}

function sendPrivateMessage(toUsername, text) {
    const chatId = getPrivateChatId(currentUser.username, toUsername);
    
    if (!privateMessages[chatId]) {
        privateMessages[chatId] = [];
    }
    
    const message = {
        id: Date.now() + Math.random(),
        from: currentUser.username,
        to: toUsername,
        text: text,
        timestamp: Date.now()
    };
    
    privateMessages[chatId].push(message);
    localStorage.setItem('privateMessages', JSON.stringify(privateMessages));
    
    addPrivateChat(toUsername);
}

function addPrivateChat(username) {
    if (username === currentUser.username) return;
    if (username === 'anonymous') return;
    
    const chatId = getPrivateChatId(currentUser.username, username);
    
    if (!privateChats.includes(chatId)) {
        privateChats.push(chatId);
        localStorage.setItem('privateChats', JSON.stringify(privateChats));
        renderPrivateChannels();
    }
}

function getPrivateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}

function toggleStar(message) {
    if (!currentUser) return;
    
    const userStarred = starredMessages.filter(s => s.username === currentUser.username);
    const existing = userStarred.find(s => 
        s.messageId === message.id && 
        s.channel === message.channel
    );
    
    if (existing) {
        starredMessages = starredMessages.filter(s => 
            !(s.username === currentUser.username && 
              s.messageId === message.id && 
              s.channel === message.channel)
        );
    } else {
        starredMessages.push({
            username: currentUser.username,
            messageId: message.id,
            channel: message.channel,
            fromUser: message.username,
            text: message.text,
            timestamp: message.timestamp,
            starredAt: Date.now()
        });
    }
    
    localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
    renderStarredList();
    renderMessages();
}

function renderStarredList() {
    const container = document.getElementById('starred-messages-list');
    if (!container || !currentUser) return;
    
    container.innerHTML = '';
    
    const userStarred = starredMessages
        .filter(s => s.username === currentUser.username)
        .sort((a, b) => b.starredAt - a.starredAt)
        .slice(0, 5);
    
    userStarred.forEach(star => {
        const item = document.createElement('div');
        item.className = 'starred-item';
        item.dataset.starId = star.messageId;
        
        const preview = star.text.length > 20 ? star.text.substring(0, 20) + '...' : star.text;
        
        item.innerHTML = `
            <span class="star-icon">★</span>
            <span>${escapeHTML(star.fromUser)}: ${escapeHTML(preview)}</span>
        `;
        
        item.addEventListener('click', function() {
            document.querySelectorAll('.channel, .private-channel, .starred-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            currentStarredView = true;
            currentChannel = null;
            currentPrivateUser = null;
            
            const header = document.getElementById('current-channel-header');
            if (header) header.textContent = '★ STARRED';
            
            renderStarredMessages();
        });
        
        container.appendChild(item);
    });
}

function renderStarredMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const inputArea = document.getElementById('message-input-area');
    if (inputArea) inputArea.style.display = 'none';
    
    const userStarred = starredMessages
        .filter(s => s.username === currentUser.username)
        .sort((a, b) => b.starredAt - a.starredAt);
    
    if (userStarred.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: #666;">no starred messages</div>';
        return;
    }
    
    userStarred.forEach(star => {
        const messageEl = document.createElement('div');
        messageEl.className = 'starred-message';
        messageEl.innerHTML = `
            <div class="starred-meta">
                <span>#${escapeHTML(star.channel)}</span>
                <span>${escapeHTML(star.fromUser)}</span>
                <span>${new Date(star.timestamp).toLocaleString()}</span>
            </div>
            <div class="message-text">${escapeHTML(star.text)}</div>
        `;
        container.appendChild(messageEl);
    });
}

function renderPrivateChannels() {
    const container = document.getElementById('private-channels-list');
    if (!container || !currentUser) return;
    
    container.innerHTML = '';
    
    const userPrivateChats = privateChats.filter(chatId => 
        chatId.includes(currentUser.username)
    );
    
    userPrivateChats.forEach(chatId => {
        const users = chatId.split('_');
        const otherUser = users[0] === currentUser.username ? users[1] : users[0];
        
        const channelEl = document.createElement('div');
        channelEl.className = 'private-channel';
        if (currentPrivateUser === otherUser && !currentStarredView) {
            channelEl.classList.add('active');
        }
        channelEl.dataset.private = otherUser;
        
        channelEl.innerHTML = `
            <div class="private-avatar"></div>
            <span>💬 ${escapeHTML(otherUser)}</span>
        `;
        
        channelEl.addEventListener('click', function(e) {
            document.querySelectorAll('.channel, .private-channel, .starred-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            currentPrivateUser = otherUser;
            currentChannel = null;
            currentStarredView = false;
            
            const header = document.getElementById('current-channel-header');
            if (header) header.textContent = `💬 ${otherUser}`;
            
            renderMessages();
        });
        
        container.appendChild(channelEl);
    });
}

function openPrivateChat(username) {
    if (!currentUser) return;
    if (username === currentUser.username) return;
    if (username === 'anonymous') return;
    
    addPrivateChat(username);
    
    currentPrivateUser = username;
    currentChannel = null;
    currentStarredView = false;
    
    document.querySelectorAll('.channel, .private-channel, .starred-item').forEach(el => {
        el.classList.remove('active');
    });
    
    const privateChannel = Array.from(document.querySelectorAll('.private-channel'))
        .find(el => el.dataset.private === username);
    if (privateChannel) {
        privateChannel.classList.add('active');
    }
    
    const header = document.getElementById('current-channel-header');
    if (header) header.textContent = `💬 ${username}`;
    
    renderMessages();
}

function getBadge(count) {
    if (count >= 1000) return '[1000+]';
    if (count >= 100) return '[100+]';
    return '';
}

function updateBadge() {
    const badgeEl = document.getElementById('current-badge');
    if (badgeEl && currentUser) {
        const badge = getBadge(currentUser?.messagesCount || 0);
        badgeEl.textContent = badge;
    }
}

function toggleInvisible() {
    invisibleMode = !invisibleMode;
    const btn = document.getElementById('invisible-mode');
    if (btn) {
        if (invisibleMode) {
            btn.classList.add('invisible-on');
            btn.textContent = '👤❌';
            btn.title = 'invisible mode on';
        } else {
            btn.classList.remove('invisible-on');
            btn.textContent = '👤';
            btn.title = 'invisible mode off';
        }
    }
}

function renderMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentStarredView) {
        renderStarredMessages();
        return;
    }
    
    if (currentChannel === 'disclaimer') {
        const inputArea = document.getElementById('message-input-area');
        if (inputArea) inputArea.style.display = 'none';
        
        const disclaimerEl = document.createElement('div');
        disclaimerEl.className = 'disclaimer-content';
        disclaimerEl.innerHTML = `
            <div class="disclaimer-section">
                <div class="disclaimer-title">RUSSIAN FEDERATION</div>
                <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHTML(disclaimerText.russia)}</pre>
            </div>
            <div class="disclaimer-section">
                <div class="disclaimer-title">UNITED STATES</div>
                <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHTML(disclaimerText.usa)}</pre>
            </div>
        `;
        container.appendChild(disclaimerEl);
    } else if (currentPrivateUser) {
        renderPrivateMessages(container);
    } else if (currentChannel) {
        renderPublicMessages(container);
    }
    
    container.scrollTop = container.scrollHeight;
}

function renderPublicMessages(container) {
    const inputArea = document.getElementById('message-input-area');
    if (inputArea) inputArea.style.display = 'flex';
    
    const channelMessages = messages[currentChannel] || [];
    
    channelMessages.forEach(msg => {
        let displayUsername = msg.username;
        let badge = '';
        
        if (msg.invisible && msg.originalUsername) {
            displayUsername = 'anonymous';
        } else {
            const user = users.find(u => u.username === msg.username);
            const count = user ? user.messagesCount : 0;
            badge = getBadge(count);
        }
        
        const isStarred = currentUser && starredMessages.some(s => 
            s.username === currentUser.username && 
            s.messageId === msg.id && 
            s.channel === msg.channel
        );
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.innerHTML = `
            <div class="message-avatar" data-username="${escapeHTML(msg.username)}"></div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${escapeHTML(displayUsername)}</span>
                    <span class="message-badge">${badge}</span>
                </div>
                <div class="message-text">${escapeHTML(msg.text)}</div>
            </div>
            <span class="message-star ${isStarred ? 'starred' : ''}">${isStarred ? '★' : '☆'}</span>
        `;
        
        const avatar = messageEl.querySelector('.message-avatar');
        if (avatar && msg.username !== 'anonymous' && msg.username !== currentUser.username) {
            avatar.addEventListener('click', function(e) {
                e.stopPropagation();
                openPrivateChat(msg.username);
            });
        }
        
        const star = messageEl.querySelector('.message-star');
        star.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleStar(msg);
        });
        
        container.appendChild(messageEl);
    });
}

function renderPrivateMessages(container) {
    const inputArea = document.getElementById('message-input-area');
    if (inputArea) inputArea.style.display = 'flex';
    
    const chatId = getPrivateChatId(currentUser.username, currentPrivateUser);
    const chatMessages = privateMessages[chatId] || [];
    
    chatMessages.forEach(msg => {
        const isFromMe = msg.from === currentUser.username;
        const displayUsername = isFromMe ? 'you' : msg.from;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.innerHTML = `
            <div class="message-avatar"></div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${escapeHTML(displayUsername)}</span>
                </div>
                <div class="message-text">${escapeHTML(msg.text)}</div>
            </div>
        `;
        
        container.appendChild(messageEl);
    });
}

function escapeHTML(text) {
    if (text === undefined || text === null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(text) {
    const msgEl = document.getElementById('auth-message');
    if (msgEl) msgEl.textContent = text;
}

function setupEventListeners() {
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const sendBtn = document.getElementById('send-btn');
    const invisibleBtn = document.getElementById('invisible-mode');
    const messageInput = document.getElementById('message-input');
    const channels = document.querySelectorAll('.channel:not(.private-channel)');
    
    if (registerBtn) registerBtn.addEventListener('click', register);
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (invisibleBtn) invisibleBtn.addEventListener('click', toggleInvisible);
    
    channels.forEach(ch => {
        ch.addEventListener('click', function() {
            document.querySelectorAll('.channel, .private-channel, .starred-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            currentChannel = this.dataset.channel;
            currentPrivateUser = null;
            currentStarredView = false;
            
            const header = document.getElementById('current-channel-header');
            if (header) header.textContent = '#' + this.textContent.trim();
            
            renderMessages();
        });
    });
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}
