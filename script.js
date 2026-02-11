// данные
let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || {
    world: [],
    russia: [],
    usa: []
};
let currentUser = null;
let currentChannel = 'world';

// init
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

// ui
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

// auth
function register() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showMessage('поля не могут быть пустыми');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        showMessage('никнейм занят');
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
        showMessage('неверный никнейм или пароль');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

// сообщения
function sendMessage() {
    if (!currentUser) return;
    
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
    
    // обновляем счетчик
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

// значки
function getBadge(count) {
    if (count >= 1000) return '[1000+]';
    if (count >= 100) return '[100+]';
    return '';
}

function updateBadge() {
    const badge = getBadge(currentUser?.messagesCount || 0);
    document.getElementById('current-badge').textContent = badge;
}

// рендер
function renderMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
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
    
    container.scrollTop = container.scrollHeight;
}

// утилиты
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(text) {
    document.getElementById('auth-message').textContent = text;
}

// события
function setupEventListeners() {
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    
    document.querySelectorAll('.channel').forEach(ch => {
        ch.addEventListener('click', function() {
            document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentChannel = this.dataset.channel;
            document.getElementById('current-channel-header').textContent = '#' + currentChannel;
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
