// ============================================
// NEW FEATURES - FRIENDS, GROUPS, BACKGROUND
// ============================================

let friends = JSON.parse(localStorage.getItem('friends')) || [];
let friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || [];
let groups = JSON.parse(localStorage.getItem('groups')) || [];
let groupInvites = JSON.parse(localStorage.getItem('groupInvites')) || [];
let groupMessages = JSON.parse(localStorage.getItem('groupMessages')) || {};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (document.getElementById('main-container').classList.contains('active')) {
            initNewFeatures();
        }
    }, 100);
});

function initNewFeatures() {
    renderFriendsList();
    renderFriendRequests();
    renderGroupsList();
    renderGroupInvites();
    addBackgroundButton();
    
    setTimeout(() => {
        if (!currentUser) return;
        openDisclaimerByDefault();
    }, 200);
}

function openDisclaimerByDefault() {
    const disclaimerChannel = Array.from(document.querySelectorAll('.channel'))
        .find(el => el.dataset.channel === 'disclaimer');
    if (disclaimerChannel) {
        disclaimerChannel.click();
    }
}

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
    
    bgBtn.addEventListener('click', function() {
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

function sendFriendRequest(username) {
    if (!currentUser) return;
    if (username === currentUser.username) return;
    if (username === 'anonymous') return;
    
    const existing = friendRequests.find(r => 
        r.from === currentUser.username && 
        r.to === username && 
        r.status === 'pending'
    );
    
    if (existing) return;
    
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
    renderMessages();
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
        
        const privateHeader = Array.from(document.querySelectorAll('.channel-header'))
            .find(el => el.textContent === 'PRIVATE');
        
        if (privateHeader) {
            privateHeader.insertAdjacentElement('beforebegin', friendsHeader);
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
            <span style="margin-left: auto; color: #666; font-size: 12px;">★</span>
        `;
        
        friendEl.addEventListener('click', function() {
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
        
        groupEl.addEventListener('click', function() {
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
    
    createGroupBtn.addEventListener('click', function() {
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

function openGroupChat(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    currentChannel = groupId;
    currentPrivateUser = null;
    currentStarredView = false;
    
    document.querySelectorAll('.channel, .private-channel, .starred-item').forEach(el => {
        el.classList.remove('active');
    });
    
    const groupEl = Array.from(document.querySelectorAll('.group-channel'))
        .find(el => el.dataset.group === groupId);
    if (groupEl) groupEl.classList.add('active');
    
    const header = document.getElementById('current-channel-header');
    if (header) header.textContent = `👥 ${group.name}`;
    
    renderGroupMessages();
}

function renderGroupMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
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

const originalSendMessage = sendMessage;
window.sendMessage = function() {
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
    } else {
        sendPublicMessage(text);
    }
    
    input.value = '';
    renderMessages();
};

window.openPrivateChat = function(username) {
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
            if (confirm(`add ${username} to friends?`)) {
                sendFriendRequest(username);
            }
        }
    }, 500);
};

const originalRenderMessages = renderMessages;
window.renderMessages = function() {
    if (currentStarredView) {
        renderStarredMessages();
    } else if (currentChannel === 'disclaimer') {
        const container = document.getElementById('messages-container');
        if (container) {
            const inputArea = document.getElementById('message-input-area');
            if (inputArea) inputArea.style.display = 'none';
            
            container.innerHTML = '';
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
        }
    } else if (currentPrivateUser) {
        renderPrivateMessages(document.getElementById('messages-container'));
    } else if (currentChannel && currentChannel.toString().startsWith('group_')) {
        renderGroupMessages();
    } else if (currentChannel) {
        renderPublicMessages(document.getElementById('messages-container'));
    }
};

window.addEventListener('load', function() {
    setTimeout(() => {
        if (document.getElementById('main-container').classList.contains('active')) {
            initNewFeatures();
        }
    }, 300);
});
