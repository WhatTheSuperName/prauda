// ============================================
// BLACK CHAT - ПОЛНАЯ ВЕРСИЯ
// ВСЁ В ОДНОМ ФАЙЛЕ, БАГИ ИСПРАВЛЕНЫ
// ============================================

let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || {
    world: [],
    russia: [],
    usa: []
};
let privateMessages = JSON.parse(localStorage.getItem('privateMessages')) || {};
let privateChats = JSON.parse(localStorage.getItem('privateChats')) || [];
let starredMessages = JSON.parse(localStorage.getItem('starredMessages')) || [];

let friends = JSON.parse(localStorage.getItem('friends')) || [];
let friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || [];
let groups = JSON.parse(localStorage.getItem('groups')) || [];
let groupInvites = JSON.parse(localStorage.getItem('groupInvites')) || [];
let groupMessages = JSON.parse(localStorage.getItem('groupMessages')) || {};

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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
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
    renderFriendsList();
    renderFriendRequests();
    renderGroupsList();
    renderGroupInvites();
    addBackgroundButton();
    
    setTimeout(() => {
        openDisclaimerByDefault();
    }, 100);
}

// ========== АВТОРИЗАЦИЯ ==========
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

// ========== ОТПРАВКА СООБЩЕНИЙ ==========
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
    } else if (currentChannel && currentChannel.toString().startsWith('group_')) {
        sendGroupMessage(currentChannel, text);
    } else if (currentChannel) {
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

function sendGroupMessage(groupId, text) {
    if (!groupMessages[groupId]) {
        groupMessages[groupId] = [];
    }
    
    const message = {
        id: Date.now() + Math.random(),
        from: currentUser.username,
        text: text,
        timestamp: Date.now()
    };
    
    groupMessages[groupId].push(message);
    localStorage.setItem('groupMessages', JSON.stringify(groupMessages));
}

// ========== ЧАТЫ ==========
function getPrivateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
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

function openPrivateChat(username) {
    if (!currentUser) return;
    if (username === currentUser.username) return;
    if (username === 'anonymous') return;
    
    addPrivateChat(username);
    
    currentPrivateUser = username;
    currentChannel = null;
    currentStarredView = false;
    
    document.querySelectorAll('.channel, .private-channel, .starred-item, .group-channel, .friend-channel').forEach(el => {
        el.classList.remove('active');
    });
    
    const privateChannel = Array.from(document.querySelectorAll('.private-channel:not(.friend-channel):not(.group-channel)'))
        .find(el => el.dataset.private === username);
    if (privateChannel) {
        privateChannel.classList.add('active');
    }
    
    const header = document.getElementById('current-channel-header');
    if (header) header.textContent = `💬 ${username}`;
    
    renderMessages();
    
    setTimeout(() => {
        if (!isFriend(username) && username !== 'anonymous') {
            sendFriendRequest(username);
        }
    }, 500);
}

function openGroupChat(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    currentChannel = groupId;
    currentPrivateUser = null;
    currentStarredView = false;
    
    document.querySelectorAll('.channel, .private-channel, .starred-item, .group-channel, .friend-channel').forEach(el => {
        el.classList.remove('active');
    });
    
    const groupEl = Array.from(document.querySelectorAll('.group-channel'))
        .find(el => el.dataset.group === groupId);
    if (groupEl) groupEl.classList.add('active');
    
    const header = document.getElementById('current-channel-header');
    if (header) header.textContent = `👥 ${group.name}`;
    
    renderMessages();
}

function openDisclaimerByDefault() {
    const disclaimerChannel = Array.from(document.querySelectorAll('.channel'))
        .find(el => el.dataset.channel === 'disclaimer');
    if (disclaimerChannel) {
        disclaimerChannel.click();
    }
}

// ========== ИЗБРАННОЕ ==========
function toggleStar(message) {
    if (!currentUser) return;
    
    const existingIndex = starredMessages.findIndex(s => 
        s.username === currentUser.username && 
        s.messageId === message.id && 
        s.channel === message.channel
    );
    
    if (existingIndex !== -1) {
        starredMessages.splice(existingIndex, 1);
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
        
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.channel, .private-channel, .starred-item, .group-channel, .friend-channel').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            currentStarredView = true;
            currentChannel = null;
            currentPrivateUser = null;
            
            const header = document.getElementById('current-channel-header');
            if (header) header.textContent = '★ STARRED';
            
            renderMessages();
        });
        
        container.appendChild(item);
    });
}

function removeFromStarred(messageId, channel) {
    starredMessages = starredMessages.filter(s => 
        !(s.username === currentUser.username && 
          s.messageId === messageId && 
          s.channel === channel)
    );
    
    localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
    renderStarredList();
    renderMessages();
}

// ========== ДРУЗЬЯ ==========
function sendFriendRequest(username) {
    if (!currentUser) return;
    if (username === currentUser.username) return;
    if (username === 'anonymous') return;
    if (!users.find(u => u.username === username)) return;
    
    const existing = friendRequests.find(r => 
        r.from === currentUser.username && 
        r.to === username && 
        r.status === 'pending'
    );
    
    if (existing) return;
    if (isFriend(username)) return;
    
    friendRequests.push({
        id: Date.now() + Math.random(),
        from: currentUser.username,
        to: username,
        status: 'pending',
        timestamp: Date.now()
    });
    
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    renderFriendRequests();
}

function acceptFriendRequest(requestId) {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    
    request.status = 'accepted';
    
    if (!friends.some(f => 
        (f.user1 === request.from && f.user2 === request.to) || 
        (f.user1 === request.to && f.user2 === request.from)
    )) {
        friends.push({
            user1: request.from,
            user2: request.to,
            since: Date.now()
        });
    }
    
    localStorage.setItem('friends', JSON.stringify(friends));
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    
    renderFriendsList();
    renderFriendRequests();
}

function declineFriendRequest(requestId) {
    friendRequests = friendRequests.filter(r => r.id !== requestId);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    renderFriendRequests();
}

function removeFriend(username) {
    friends = friends.filter(f => 
        !(f.user1 === currentUser.username && f.user2 === username) &&
        !(f.user2 === currentUser.username && f.user1 === username)
    );
    
    localStorage.setItem('friends', JSON.stringify(friends));
    renderFriendsList();
}

function isFriend(username) {
    if (!currentUser) return false;
    return friends.some(f => 
        (f.user1 === currentUser.username && f.user2 === username) ||
        (f.user2 === currentUser.username && f.user1 === username)
    );
}

function renderFriendsList() {
    const container = document.querySelector('.channels');
    if (!container || !currentUser) return;
    
    let friendsHeader = document.getElementById('friends-header');
    let friendsList = document.getElementById('friends-list');
    
    if (!friendsHeader) {
        friendsHeader = document.createElement('div');
        friendsHeader.id = 'friends-header';
        friendsHeader.className = 'channel-header';
        friendsHeader.textContent = 'FRIENDS';
        
        const starredDivider = Array.from(document.querySelectorAll('.channel-divider'))[1];
        if (starredDivider) {
            starredDivider.insertAdjacentElement('afterend', friendsHeader);
        }
    }
    
    if (!friendsList) {
        friendsList = document.createElement('div');
        friendsList.id = 'friends-list';
        friendsHeader.insertAdjacentElement('afterend', friendsList);
    }
    
    friendsList.innerHTML = '';
    
    const userFriends = friends.filter(f => 
        f.user1 === currentUser.username || f.user2 === currentUser.username
    );
    
    userFriends.forEach(f => {
        const friendName = f.user1 === currentUser.username ? f.user2 : f.user1;
        
        const friendEl = document.createElement('div');
        friendEl.className = 'private-channel friend-channel';
        friendEl.dataset.friend = friendName;
        
        friendEl.innerHTML = `
            <div class="private-avatar"></div>
            <span>👤 ${escapeHTML(friendName)}</span>
            <span style="margin-left: auto; color: #fff; font-size: 12px;">★</span>
        `;
        
        friendEl.addEventListener('click', function(e) {
            e.stopPropagation();
            openPrivateChat(friendName);
        });
        
        friendEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (confirm(`remove ${friendName} from friends?`)) {
                removeFriend(friendName);
            }
        });
        
        friendsList.appendChild(friendEl);
    });
}

function renderFriendRequests() {
    if (!currentUser) return;
    
    const container = document.querySelector('.channels');
    if (!container) return;
    
    let requestsHeader = document.getElementById('requests-header');
    let requestsList = document.getElementById('requests-list');
    
    const incoming = friendRequests.filter(r => 
        r.to === currentUser.username && 
        r.status === 'pending'
    );
    
    if (incoming.length === 0) {
        if (requestsHeader) requestsHeader.remove();
        if (requestsList) requestsList.remove();
        return;
    }
    
    if (!requestsHeader) {
        requestsHeader = document.createElement('div');
        requestsHeader.id = 'requests-header';
        requestsHeader.className = 'channel-header';
        requestsHeader.textContent = 'REQUESTS';
        
        const friendsHeader = document.getElementById('friends-header');
        if (friendsHeader) {
            friendsHeader.insertAdjacentElement('beforebegin', requestsHeader);
        }
    }
    
    if (!requestsList) {
        requestsList = document.createElement('div');
        requestsList.id = 'requests-list';
        requestsHeader.insertAdjacentElement('afterend', requestsList);
    }
    
    requestsList.innerHTML = '';
    
    incoming.forEach(req => {
        const reqEl = document.createElement('div');
        reqEl.className = 'private-channel';
        reqEl.style.display = 'flex';
        reqEl.style.flexDirection = 'column';
        reqEl.style.alignItems = 'flex-start';
        reqEl.style.padding = '10px';
        
        reqEl.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 5px;">
                <div class="private-avatar"></div>
                <span>👤 ${escapeHTML(req.from)}</span>
            </div>
            <div style="display: flex; gap: 5px; width: 100%;">
                <button style="flex: 1; padding: 5px;" class="accept-request" data-id="${req.id}">✓</button>
                <button style="flex: 1; padding: 5px;" class="decline-request" data-id="${req.id}">✗</button>
            </div>
        `;
        
        reqEl.querySelector('.accept-request').addEventListener('click', function(e) {
            e.stopPropagation();
            acceptFriendRequest(req.id);
        });
        
        reqEl.querySelector('.decline-request').addEventListener('click', function(e) {
            e.stopPropagation();
            declineFriendRequest(req.id);
        });
        
        requestsList.appendChild(reqEl);
    });
}

// ========== ГРУППЫ ==========
function createGroup(name) {
    if (!currentUser) return;
    
    const userGroups = groups.filter(g => g.members.includes(currentUser.username));
    if (userGroups.length >= 10) {
        alert('maximum 10 groups');
        return;
    }
    
    const group = {
        id: 'group_' + Date.now() + Math.random(),
        name: name || `group_${userGroups.length + 1}`,
        creator: currentUser.username,
        members: [currentUser.username],
        created: Date.now()
    };
    
    groups.push(group);
    localStorage.setItem('groups', JSON.stringify(groups));
    
    groupMessages[group.id] = [];
    localStorage.setItem('groupMessages', JSON.stringify(groupMessages));
    
    renderGroupsList();
    openGroupChat(group.id);
}

function inviteToGroup(groupId, username) {
    if (!currentUser) return;
    if (username === currentUser.username) return;
    if (!isFriend(username)) return;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.members.includes(username)) return;
    
    const existing = groupInvites.find(i => 
        i.groupId === groupId && 
        i.to === username && 
        i.status === 'pending'
    );
    
    if (existing) return;
    
    groupInvites.push({
        id: Date.now() + Math.random(),
        groupId: groupId,
        groupName: group.name,
        from: currentUser.username,
        to: username,
        status: 'pending',
        timestamp: Date.now()
    });
    
    localStorage.setItem('groupInvites', JSON.stringify(groupInvites));
    renderGroupInvites();
}

function acceptGroupInvite(inviteId) {
    const invite = groupInvites.find(i => i.id === inviteId);
    if (!invite) return;
    
    const group = groups.find(g => g.id === invite.groupId);
    if (!group) return;
    
    if (!group.members.includes(invite.to)) {
        group.members.push(invite.to);
    }
    
    invite.status = 'accepted';
    
    localStorage.setItem('groups', JSON.stringify(groups));
    localStorage.setItem('groupInvites', JSON.stringify(groupInvites));
    
    renderGroupsList();
    renderGroupInvites();
}

function declineGroupInvite(inviteId) {
    groupInvites = groupInvites.filter(i => i.id !== inviteId);
    localStorage.setItem('groupInvites', JSON.stringify(groupInvites));
    renderGroupInvites();
}

function removeGroup(groupId) {
    groups = groups.filter(g => g.id !== groupId);
    delete groupMessages[groupId];
    
    groupInvites = groupInvites.filter(i => i.groupId !== groupId);
    
    localStorage.setItem('groups', JSON.stringify(groups));
    localStorage.setItem('groupMessages', JSON.stringify(groupMessages));
    localStorage.setItem('groupInvites', JSON.stringify(groupInvites));
    
    renderGroupsList();
    
    if (currentChannel === groupId) {
        const worldChannel = document.querySelector('.channel[data-channel="world"]');
        if (worldChannel) worldChannel.click();
    }
}

function renderGroupsList() {
    const container = document.querySelector('.channels');
    if (!container || !currentUser) return;
    
    let groupsHeader = document.getElementById('groups-header');
    let groupsList = document.getElementById('groups-list');
    
    if (!groupsHeader) {
        groupsHeader = document.createElement('div');
        groupsHeader.id = 'groups-header';
        groupsHeader.className = 'channel-header';
        groupsHeader.textContent = 'GROUPS';
        
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            friendsList.insertAdjacentElement('afterend', groupsHeader);
        } else {
            const privateHeader = Array.from(document.querySelectorAll('.channel-header'))
                .find(el => el.textContent === 'PRIVATE');
            if (privateHeader) {
                privateHeader.insertAdjacentElement('beforebegin', groupsHeader);
            }
        }
    }
    
    if (!groupsList) {
        groupsList = document.createElement('div');
        groupsList.id = 'groups-list';
        groupsHeader.insertAdjacentElement('afterend', groupsList);
    }
    
    groupsList.innerHTML = '';
    
    const userGroups = groups.filter(g => g.members.includes(currentUser.username));
    
    userGroups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'private-channel group-channel';
        groupEl.dataset.group = group.id;
        
        groupEl.innerHTML = `
            <div class="private-avatar"></div>
            <span>👥 ${escapeHTML(group.name)}</span>
            <span style="margin-left: auto; color: #666; font-size: 11px;">${group.members.length}</span>
        `;
        
        groupEl.addEventListener('click', function(e) {
            e.stopPropagation();
            openGroupChat(group.id);
        });
        
        groupEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (group.creator === currentUser.username) {
                if (confirm(`delete group ${group.name}?`)) {
                    removeGroup(group.id);
                }
            }
        });
        
        groupsList.appendChild(groupEl);
    });
    
    const createGroupBtn = document.createElement('div');
    createGroupBtn.className = 'private-channel';
    createGroupBtn.style.border = '1px dashed #666';
    createGroupBtn.innerHTML = `
        <span style="margin: 0 auto;">+ create group</span>
    `;
    
    createGroupBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const name = prompt('group name:');
        if (name) createGroup(name);
    });
    
    groupsList.appendChild(createGroupBtn);
}

function renderGroupInvites() {
    if (!currentUser) return;
    
    const container = document.querySelector('.channels');
    if (!container) return;
    
    let invitesHeader = document.getElementById('invites-header');
    let invitesList = document.getElementById('invites-list');
    
    const incoming = groupInvites.filter(i => 
        i.to === currentUser.username && 
        i.status === 'pending'
    );
    
    if (incoming.length === 0) {
        if (invitesHeader) invitesHeader.remove();
        if (invitesList) invitesList.remove();
        return;
    }
    
    if (!invitesHeader) {
        invitesHeader = document.createElement('div');
        invitesHeader.id = 'invites-header';
        invitesHeader.className = 'channel-header';
        invitesHeader.textContent = 'INVITES';
        
        const requestsHeader = document.getElementById('requests-header');
        if (requestsHeader) {
            requestsHeader.insertAdjacentElement('beforebegin', invitesHeader);
        }
    }
    
    if (!invitesList) {
        invitesList = document.createElement('div');
        invitesList.id = 'invites-list';
        invitesHeader.insertAdjacentElement('afterend', invitesList);
    }
    
    invitesList.innerHTML = '';
    
    incoming.forEach(invite => {
        const inviteEl = document.createElement('div');
        inviteEl.className = 'private-channel';
        inviteEl.style.display = 'flex';
        inviteEl.style.flexDirection = 'column';
        inviteEl.style.alignItems = 'flex-start';
        inviteEl.style.padding = '10px';
        
        inviteEl.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 5px;">
                <div class="private-avatar"></div>
                <span>👥 ${escapeHTML(invite.groupName)}</span>
            </div>
            <div style="font-size: 11px; color: #999; margin-bottom: 8px;">
                from: ${escapeHTML(invite.from)}
            </div>
            <div style="display: flex; gap: 5px; width: 100%;">
                <button style="flex: 1; padding: 5px;" class="accept-invite" data-id="${invite.id}">✓</button>
                <button style="flex: 1; padding: 5px;" class="decline-invite" data-id="${invite.id}">✗</button>
            </div>
        `;
        
        inviteEl.querySelector('.accept-invite').addEventListener('click', function(e) {
            e.stopPropagation();
            acceptGroupInvite(invite.id);
        });
        
        inviteEl.querySelector('.decline-invite').addEventListener('click', function(e) {
            e.stopPropagation();
            declineGroupInvite(invite.id);
        });
        
        invitesList.appendChild(inviteEl);
    });
}

// ========== ПРИВАТНЫЕ ЧАТЫ ==========
function renderPrivateChannels() {
    const container = document.getElementById('private-channels-list');
    if (!container || !currentUser) return;
    
    container.innerHTML = '';
    
    const userPrivateChats = [...new Set(privateChats.filter(chatId => 
        chatId.includes(currentUser.username)
    ))];
    
    userPrivateChats.forEach(chatId => {
        const users = chatId.split('_');
        const otherUser = users[0] === currentUser.username ? users[1] : users[0];
        
        const channelEl = document.createElement('div');
        channelEl.className = 'private-channel';
        if (currentPrivateUser === otherUser && !currentStarredView && !currentChannel) {
            channelEl.classList.add('active');
        }
        channelEl.dataset.private = otherUser;
        
        channelEl.innerHTML = `
            <div class="private-avatar"></div>
            <span>💬 ${escapeHTML(otherUser)}</span>
            ${isFriend(otherUser) ? '<span style="margin-left: auto; color: #fff; font-size: 12px;">★</span>' : ''}
        `;
        
        channelEl.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.channel, .private-channel, .starred-item, .group-channel, .friend-channel').forEach(el => {
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
        
        channelEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (confirm(`delete chat with ${otherUser}?`)) {
                const chatId = getPrivateChatId(currentUser.username, otherUser);
                privateChats = privateChats.filter(id => id !== chatId);
                localStorage.setItem('privateChats', JSON.stringify(privateChats));
                
                if (currentPrivateUser === otherUser) {
                    const worldChannel = document.querySelector('.channel[data-channel="world"]');
                    if (worldChannel) worldChannel.click();
                }
                
                renderPrivateChannels();
            }
        });
        
        container.appendChild(channelEl);
    });
}

// ========== ЗНАЧКИ ==========
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

// ========== РЕЖИМ НЕВИДИМКИ ==========
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

// ========== ФОН ==========
function addBackgroundButton() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    if (document.getElementById('bg-btn')) return;
    
    const bgBtn = document.createElement('button');
    bgBtn.id = 'bg-btn';
    bgBtn.textContent = '🖼️ BG';
    bgBtn.style.marginTop = '10px';
    bgBtn.style.fontSize = '16px';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'bg-file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(readerEvent) {
                localStorage.setItem('backgroundImage', readerEvent.target.result);
                document.body.style.backgroundImage = `url(${readerEvent.target.result})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
                
                document.querySelector('#app').style.backgroundColor = 'rgba(0,0,0,0.85)';
                document.querySelector('#app').style.backdropFilter = 'blur(2px)';
            };
            reader.readAsDataURL(file);
        }
    });
    
    bgBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.click();
    });
    
    sidebar.appendChild(fileInput);
    sidebar.appendChild(bgBtn);
    
    const savedBg = localStorage.getItem('backgroundImage');
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.querySelector('#app').style.backgroundColor = 'rgba(0,0,0,0.85)';
        document.querySelector('#app').style.backdropFilter = 'blur(2px)';
    }
}

// ========== РЕНДЕРИНГ СООБЩЕНИЙ ==========
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
    } else if (currentChannel && currentChannel.toString().startsWith('group_')) {
        renderGroupMessages(container);
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
        
        if (isStarred) {
            star.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('remove from starred?')) {
                    removeFromStarred(msg.id, msg.channel);
                }
            });
        }
        
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

function renderGroupMessages(container) {
    const inputArea = document.getElementById('message-input-area');
    if (inputArea) inputArea.style.display = 'flex';
    
    const group = groups.find(g => g.id === currentChannel);
    if (!group) return;
    
    const messages = groupMessages[currentChannel] || [];
    
    messages.forEach(msg => {
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="starred-meta">
                    <span>#${escapeHTML(star.channel)}</span>
                    <span>${escapeHTML(star.fromUser)}</span>
                    <span>${new Date(star.timestamp).toLocaleString()}</span>
                </div>
                <span style="cursor: pointer; color: #fff; font-size: 18px;" class="remove-star" data-id="${star.messageId}" data-channel="${star.channel}">★</span>
            </div>
            <div class="message-text" style="margin-top: 10px;">${escapeHTML(star.text)}</div>
        `;
        
        const removeBtn = messageEl.querySelector('.remove-star');
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeFromStarred(star.messageId, star.channel);
        });
        
        container.appendChild(messageEl);
    });
}

// ========== УТИЛИТЫ ==========
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

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function setupEventListeners() {
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const sendBtn = document.getElementById('send-btn');
    const invisibleBtn = document.getElementById('invisible-mode');
    const messageInput = document.getElementById('message-input');
    const channels = document.querySelectorAll('.channel:not(.private-channel):not(.friend-channel):not(.group-channel)');
    
    if (registerBtn) registerBtn.addEventListener('click', register);
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (invisibleBtn) invisibleBtn.addEventListener('click', toggleInvisible);
    
    channels.forEach(ch => {
        ch.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.channel, .private-channel, .starred-item, .group-channel, .friend-channel').forEach(el => {
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

// СТАРТ
init();
