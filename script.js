// данные
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;
let messages = JSON.parse(localStorage.getItem('globalMessages')) || {
    world: [],
    russia: [],
    usa: []
};
let currentChannel = 'world';

// dom
const authPage = document.getElementById('auth');
const mainPage = document.getElementById('main');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authMsg = document.getElementById('authMessage');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const userBadge = document.getElementById('userBadge');
const channels = document.querySelectorAll('.channel');
const currentChannelLabel = document.getElementById('currentChannelLabel');
const messageList = document.getElementById('messageList');
const messageText = document.getElementById('messageText');
const sendBtn = document.getElementById('sendMessageBtn');
const postCountSpan = document.getElementById('postCount');
const badgeInfoSpan = document.getElementById('badgeInfo');

// функции
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveMessages() {
    localStorage.setItem('globalMessages', JSON.stringify(messages));
}

function getBadge(count) {
    if (count >= 1000) return '【1000】';
    if (count >= 100) return '【100】';
    return '⛔';
}

function updateUserStats() {
    if (!currentUser) return;
    const user = users.find(u => u.username === currentUser.username);
    if (user) {
        const count = user.postCount || 0;
        postCountSpan.innerText = count;
        const badge = getBadge(count);
        userBadge.innerText = badge;
        badgeInfoSpan.innerText = badge;
    }
}

function renderMessages() {
    const channelMessages = messages[currentChannel] || [];
    messageList.innerHTML = '';
    channelMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerHTML = `
            <div class="message-avatar">⬤</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${escapeHTML(msg.author)}</span>
                    <span class="message-badge">${getBadge(msg.authorPosts)}</span>
                </div>
                <div class="message-text">${escapeHTML(msg.text)}</div>
            </div>
        `;
        messageList.appendChild(msgDiv);
    });
    messageList.scrollTop = messageList.scrollHeight;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"]/g, function(match) {
        if (match === '&') return '&amp;';
        if (match === '<') return '&lt;';
        if (match === '>') return '&gt;';
        if (match === '"') return '&quot;';
        return match;
    });
}

function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        if (!currentUser.postCount) currentUser.postCount = 0;
        authPage.classList.remove('active');
        mainPage.classList.add('active');
        currentUserSpan.innerText = currentUser.username;
        updateUserStats();
        renderMessages();
        authMsg.innerText = '';
    } else {
        authMsg.innerText = 'неверный логин или пароль';
    }
}

function register(username, password) {
    if (!username || !password) {
        authMsg.innerText = 'заполните все поля';
        return;
    }
    if (users.find(u => u.username === username)) {
        authMsg.innerText = 'никнейм занят';
        return;
    }
    const newUser = { username, password, postCount: 0 };
    users.push(newUser);
    saveUsers();
    authMsg.innerText = 'аккаунт создан, войдите';
}

// события
loginBtn.addEventListener('click', () => {
    login(usernameInput.value, passwordInput.value);
});

registerBtn.addEventListener('click', () => {
    register(usernameInput.value, passwordInput.value);
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    mainPage.classList.remove('active');
    authPage.classList.add('active');
    usernameInput.value = '';
    passwordInput.value = '';
});

channels.forEach(ch => {
    ch.addEventListener('click', function() {
        channels.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentChannel = this.dataset.channel;
        let name = this.innerText.trim();
        currentChannelLabel.innerText = name;
        renderMessages();
    });
});

sendBtn.addEventListener('click', () => {
    if (!currentUser) return;
    const text = messageText.value.trim();
    if (!text) return;
    const user = users.find(u => u.username === currentUser.username);
    if (!user) return;
    user.postCount = (user.postCount || 0) + 1;
    saveUsers();
    const msg = {
        author: currentUser.username,
        authorPosts: user.postCount,
        text: text,
        timestamp: Date.now()
    };
    if (!messages[currentChannel]) messages[currentChannel] = [];
    messages[currentChannel].push(msg);
    saveMessages();
    messageText.value = '';
    updateUserStats();
    renderMessages();
});

messageText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// авто-вход (если есть последний пользователь)
window.onload = function() {
    if (users.length > 0) {
    }
};
