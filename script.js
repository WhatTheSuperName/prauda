let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || {
    world: [],
    russia: [],
    usa: []
};
let currentUser = null;
let currentChannel = 'world';

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
    if (localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (users.find(u => u.username === currentUser.username)) {
            showMain();
        } else {
            showAuth();
        }
    } else {
        showAuth();
    }
    
    setupEventListeners();
    renderMessages();
}

function showAuth() {
    document.getElementById('auth-container').classList.add('active');
    document.getElementById('main-container').classList.remove('active');
}

function showMain() {
    document.getElementById('auth-container').classList.remove('active');
    document.getElementById('main-container').classList.add('active');
    document.getElementById('current-username').textContent = currentUser.username;
    updateBadge();
}

function register() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
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
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showMain();
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMain();
    } else {
        showMessage('invalid username or password');
    }
}

function sendMessage() {
    if (!currentUser) return;
    if (currentChannel === 'disclaimer') return;
    
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const message = {
        id: Date.now() + Math.random(),
        username: currentUser.username,
        text: text,
        timestamp: Date.now(),
        channel: currentChannel
    };
    
    messages[currentChannel].push(message);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].messagesCount++;
        currentUser.messagesCount = users[userIndex].messagesCount;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateBadge();
    }
    
    input.value = '';
    renderMessages();
}

function getBadge(count) {
    if (count >= 1000) return '[1000+]';
    if (count >= 100) return '[100+]';
    return '';
}

function updateBadge() {
    const badge = getBadge(currentUser?.messagesCount || 0);
    document.getElementById('current-badge').textContent = badge;
}

function renderMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    if (currentChannel === 'disclaimer') {
        document.getElementById('message-input-area').style.display = 'none';
        
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
    } else {
        document.getElementById('message-input-area').style.display = 'flex';
        
        const channelMessages = messages[currentChannel] || [];
        
        channelMessages.forEach(msg => {
            const user = users.find(u => u.username === msg.username);
            const count = user ? user.messagesCount : 0;
            const badge = getBadge(count);
            
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${escapeHTML(msg.username)}</span>
                        <span class="message-badge">${badge}</span>
                    </div>
                    <div class="message-text">${escapeHTML(msg.text)}</div>
                </div>
            `;
            container.appendChild(messageEl);
        });
    }
    
    container.scrollTop = container.scrollHeight;
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(text) {
    document.getElementById('auth-message').textContent = text;
}

function setupEventListeners() {
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    
    document.querySelectorAll('.channel').forEach(ch => {
        ch.addEventListener('click', function() {
            document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentChannel = this.dataset.channel;
            document.getElementById('current-channel-header').textContent = '#' + this.textContent.trim();
            renderMessages();
        });
    });
    
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

init();
