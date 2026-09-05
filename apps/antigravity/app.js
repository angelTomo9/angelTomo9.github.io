
const REQUIRED_PASSWORD = "3789bt25";
const BROKER_WSS = "wss://broker.emqx.io:8084/mqtt";
const TOPIC_TO_PC = "antigravity/angel-3789bt25/to_pc";
const TOPIC_FROM_PC = "antigravity/angel-3789bt25/from_pc";

const state = {
  isAuthenticated: localStorage.getItem('ag_auth_pass') === REQUIRED_PASSWORD,
  currentProjectId: localStorage.getItem('ag_proj_id') || 'all',
  currentChatId: localStorage.getItem('ag_chat_id') || null,
  projects: [],
  chats: [],
  filteredChats: [],
  attachedImages: [],
  isStreaming: false,
  pcOnline: false,
  lastHeartbeat: 0,
  mqttClient: null,
  activeRequests: {}
};

// Configure Markdown & Highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; } catch (__) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const renderer = new marked.Renderer();
renderer.code = function(code, lang) {
  const language = (lang || 'código').toLowerCase();
  const highlighted = lang && hljs.getLanguage(lang)
    ? hljs.highlight(code, { language: lang }).value
    : hljs.highlightAuto(code).value;
  
  return '<div class="code-wrapper"><div class="code-header"><span>' + language + '</span><button class="copy-btn" onclick="copyCode(this)"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copiar</button></div><pre><code>' + highlighted + '</code></pre></div>';
};
marked.use({ renderer });

window.copyCode = function(btn) {
  const wrapper = btn.closest('.code-wrapper');
  const codeEl = wrapper.querySelector('pre code');
  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copiado!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copiar';
    }, 2000);
  });
};

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginPinInput = document.getElementById('loginPinInput');
const loginError = document.getElementById('loginError');

const connectionBadge = document.getElementById('connectionBadge');
const connectionText = document.getElementById('connectionText');
const btnSyncHeader = document.getElementById('btnSyncHeader');

const drawerOverlay = document.getElementById('drawerOverlay');
const drawerSidebar = document.getElementById('drawerSidebar');
const btnOpenDrawer = document.getElementById('btnOpenDrawer');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');

const headerTitleArea = document.getElementById('headerTitleArea');
const headerProjectName = document.getElementById('headerProjectName');
const headerChatTitle = document.getElementById('headerChatTitle');
const projectSelect = document.getElementById('projectSelect');
const btnNewProject = document.getElementById('btnNewProject');

const chatsListContainer = document.getElementById('chatsListContainer');
const chatSearchInput = document.getElementById('chatSearchInput');
const btnNewChatHeader = document.getElementById('btnNewChatHeader');
const btnNewChatDrawer = document.getElementById('btnNewChatDrawer');

const messagesList = document.getElementById('messagesList');
const chatScrollContainer = document.getElementById('chatScrollContainer');

const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const btnSendMessage = document.getElementById('btnSendMessage');
const btnAttachImage = document.getElementById('btnAttachImage');
const imageFileInput = document.getElementById('imageFileInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');

// Authentication Handling
function checkAuth() {
  if (!state.isAuthenticated) {
    loginModal.classList.remove('hidden');
    loginPinInput.value = '';
    loginPinInput.focus();
  } else {
    loginModal.classList.add('hidden');
    initBridge();
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = loginPinInput.value.trim();
  if (val === REQUIRED_PASSWORD) {
    state.isAuthenticated = true;
    localStorage.setItem('ag_auth_pass', REQUIRED_PASSWORD);
    loginModal.classList.add('hidden');
    initBridge();
  } else {
    loginError.textContent = 'Contraseña incorrecta';
    loginError.classList.remove('hidden');
  }
});

// Update PC Connection Status UI
function updateConnectionUI(online) {
  state.pcOnline = online;
  if (online) {
    connectionBadge.className = 'w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse';
    connectionText.textContent = 'PC Conectado';
    connectionText.className = 'text-[10px] font-bold text-emerald-400';
  } else {
    connectionBadge.className = 'w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse';
    connectionText.textContent = 'Buscando PC...';
    connectionText.className = 'text-[10px] font-bold text-amber-400';
  }
}

// Initialize Real-time Cloud Bridge to PC
function initBridge() {
  updateConnectionUI(false);

  state.mqttClient = mqtt.connect(BROKER_WSS, {
    reconnectPeriod: 2500,
    keepalive: 30
  });

  state.mqttClient.on('connect', () => {
    console.log('✅ Conectado al bus de mensajes WSS en la nube');
    state.mqttClient.subscribe(TOPIC_FROM_PC, (err) => {
      if (!err) {
        requestPCData();
      }
    });
  });

  state.mqttClient.on('message', (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      handlePCMessage(msg);
    } catch(e) {
      console.error('Error parsing bridge message:', e);
    }
  });

  // Watchdog for Heartbeat
  setInterval(() => {
    const isAlive = (Date.now() - state.lastHeartbeat) < 8000;
    updateConnectionUI(isAlive);
  }, 3000);

  // Auto-reload on page visibility change (when mobile user comes back to browser tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestPCData();
      if (state.currentChatId) {
        loadChatFromPC(state.currentChatId);
      }
    }
  });

  loadCachedData();
}

function requestPCData() {
  const reqId = 'req-data-' + Date.now();
  sendToPC({ action: 'get_data', reqId });
}

function sendToPC(data) {
  if (state.mqttClient && state.mqttClient.connected) {
    state.mqttClient.publish(TOPIC_TO_PC, JSON.stringify(data));
  }
}

function handlePCMessage(msg) {
  if (msg.type === 'heartbeat') {
    state.lastHeartbeat = Date.now();
    updateConnectionUI(true);
  } else if (msg.type === 'data_response') {
    state.lastHeartbeat = Date.now();
    updateConnectionUI(true);
    if (msg.data) {
      state.projects = msg.data.projects || [];
      state.chats = msg.data.chats || [];
      saveCachedData();
      renderProjectSelect();
      renderFilteredChats();

      if (state.chats.length > 0) {
        if (!state.currentChatId || !state.chats.some(c => c.id === state.currentChatId)) {
          state.currentChatId = state.chats[0].id;
        }
        loadChatFromPC(state.currentChatId);
      }
    }
  } else if (msg.type === 'chat_response') {
    if (msg.chat && msg.chat.id === state.currentChatId) {
      renderChatMessages(msg.chat);
    }
  } else if (msg.type === 'chunk') {
    if (msg.chatId === state.currentChatId) {
      const activeAiBox = document.querySelector('.active-ai-stream-box');
      if (activeAiBox) {
        activeAiBox.innerHTML = marked.parse(msg.text) + '<span class="streaming-indicator"></span>';
        scrollToBottom();
      }
    }
  } else if (msg.type === 'done') {
    if (msg.chatId === state.currentChatId) {
      state.isStreaming = false;
      btnSendMessage.disabled = false;
      if (msg.chat) {
        renderChatMessages(msg.chat);
      }
    }
    requestPCData();
  } else if (msg.type === 'new_chat_created') {
    state.isStreaming = false;
    btnSendMessage.disabled = false;
    if (msg.newChat) {
      state.currentChatId = msg.newChat.id;
      localStorage.setItem('ag_chat_id', msg.newChat.id);
      requestPCData();
      closeDrawer();
      loadChatFromPC(msg.newChat.id);
    }
  }
}

// Local cache
async function loadCachedData() {
  try {
    const localSaved = localStorage.getItem('ag_saved_data');
    let allData = null;
    if (localSaved) {
      allData = JSON.parse(localSaved);
    } else {
      const res = await fetch('./chats_data.json');
      allData = await res.json();
    }
    if (allData && state.chats.length === 0) {
      state.projects = allData.projects || [];
      state.chats = allData.chats || [];
      renderProjectSelect();
      renderFilteredChats();
      if (state.chats.length > 0 && !state.currentChatId) {
        state.currentChatId = state.chats[0].id;
        renderChatMessages(state.chats[0]);
      }
    }
  } catch(e) {}
}

function saveCachedData() {
  localStorage.setItem('ag_saved_data', JSON.stringify({
    projects: state.projects,
    chats: state.chats
  }));
}

// Drawer Controls
function openDrawer() {
  drawerOverlay.classList.remove('hidden');
  setTimeout(() => {
    drawerOverlay.classList.remove('opacity-0');
    drawerSidebar.classList.remove('-translate-x-full');
  }, 10);
}

function closeDrawer() {
  drawerOverlay.classList.add('opacity-0');
  drawerSidebar.classList.add('-translate-x-full');
  setTimeout(() => drawerOverlay.classList.add('hidden'), 250);
}

btnOpenDrawer.addEventListener('click', openDrawer);
headerTitleArea.addEventListener('click', openDrawer);
btnCloseDrawer.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// Sync Button in Header
if (btnSyncHeader) {
  btnSyncHeader.addEventListener('click', () => {
    const icon = btnSyncHeader.querySelector('svg');
    if (icon) icon.classList.add('animate-spin');
    requestPCData();
    if (state.currentChatId) {
      loadChatFromPC(state.currentChatId);
    }
    setTimeout(() => {
      if (icon) icon.classList.remove('animate-spin');
    }, 1000);
  });
}

// Image attachment
btnAttachImage.addEventListener('click', () => imageFileInput.click());
imageFileInput.addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      state.attachedImages.push({ name: file.name, data: event.target.result });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  imageFileInput.value = '';
});

function renderImagePreviews() {
  if (state.attachedImages.length === 0) {
    imagePreviewContainer.classList.add('hidden');
    imagePreviewContainer.innerHTML = '';
    return;
  }
  imagePreviewContainer.classList.remove('hidden');
  imagePreviewContainer.innerHTML = '';
  state.attachedImages.forEach((img, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'relative inline-block shrink-0';
    thumb.innerHTML = '<img src="' + img.data + '" class="w-16 h-16 object-cover rounded-xl border border-indigo-500 shadow"><button type="button" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow" onclick="removeAttachedImage(' + idx + ')">✕</button>';
    imagePreviewContainer.appendChild(thumb);
  });
}

window.removeAttachedImage = function(index) {
  state.attachedImages.splice(index, 1);
  renderImagePreviews();
};

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

function renderProjectSelect() {
  projectSelect.innerHTML = '';
  state.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    const countStr = p.chatCount > 0 ? (' (' + p.chatCount + ')') : '';
    opt.textContent = p.name + countStr;
    projectSelect.appendChild(opt);
  });
  projectSelect.value = state.currentProjectId;
  updateHeaderProjectName();
}

function updateHeaderProjectName() {
  const p = state.projects.find(x => x.id === state.currentProjectId);
  if (p) headerProjectName.textContent = p.name.replace(/^[📁🌟]\s*/, '');
}

projectSelect.addEventListener('change', () => {
  state.currentProjectId = projectSelect.value;
  localStorage.setItem('ag_proj_id', state.currentProjectId);
  updateHeaderProjectName();
  renderFilteredChats();

  const available = getFilteredChats();
  if (available.length > 0) {
    state.currentChatId = available[0].id;
    loadChatFromPC(state.currentChatId);
  }
});

function getFilteredChats() {
  let list = state.chats;
  if (state.currentProjectId !== 'all') {
    list = list.filter(c => c.projectId === state.currentProjectId);
  }
  const q = chatSearchInput.value.toLowerCase().trim();
  if (q) {
    list = list.filter(c => c.title.toLowerCase().includes(q) || (c.projectName && c.projectName.toLowerCase().includes(q)));
  }
  return list;
}

chatSearchInput.addEventListener('input', () => renderFilteredChats());

function renderFilteredChats() {
  const list = getFilteredChats();
  chatsListContainer.innerHTML = '';

  list.forEach(chat => {
    const isActive = chat.id === state.currentChatId;
    const item = document.createElement('div');
    item.className = 'p-3 rounded-2xl cursor-pointer transition ' + (isActive ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-500/60 shadow-md' : 'text-slate-300 hover:bg-slate-800/80 border border-slate-800/40');

    const projBadge = chat.projectName ? ('<span class="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md font-semibold">' + escapeHtml(chat.projectName) + '</span>') : '';

    item.innerHTML = '<div class="flex items-center gap-2 overflow-hidden mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + (isActive ? '#818cf8' : '#64748b') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="text-xs font-bold truncate text-slate-100">' + escapeHtml(chat.title) + '</span></div><div class="flex items-center justify-between text-[11px] text-slate-500 pl-5">' + projBadge + '<span>' + (chat.messageCount || (chat.messages ? chat.messages.length : 0)) + ' msgs</span></div>';

    item.addEventListener('click', () => {
      state.currentChatId = chat.id;
      localStorage.setItem('ag_chat_id', chat.id);
      renderFilteredChats();
      closeDrawer();
      loadChatFromPC(chat.id);
    });

    chatsListContainer.appendChild(item);
  });
}

function loadChatFromPC(chatId) {
  if (!chatId) return;

  const chatMeta = state.chats.find(c => c.id === chatId);
  if (chatMeta) {
    headerChatTitle.textContent = chatMeta.title || 'Conversación';
    if (chatMeta.projectName) headerProjectName.textContent = chatMeta.projectName;
  }

  // Only show placeholder spinner if chat area is currently empty
  if (messagesList.children.length === 0) {
    messagesList.innerHTML = '<div class="text-center py-16 text-slate-500 space-y-2"><div class="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div><p class="text-xs text-slate-400">Sincronizando con Antigravity...</p></div>';
  }

  sendToPC({
    action: 'get_chat',
    chatId: chatId,
    reqId: 'req-chat-' + Date.now()
  });
}

function renderChatMessages(chat) {
  headerChatTitle.textContent = chat.title || 'Conversación';
  if (chat.projectName) headerProjectName.textContent = chat.projectName;

  messagesList.innerHTML = '';
  if (!chat.messages || chat.messages.length === 0) {
    messagesList.innerHTML = '<div class="text-center py-16 text-slate-500 space-y-2"><p class="text-sm font-bold text-slate-400">Conversación lista</p><p class="text-xs text-slate-600">Escribe o adjunta una foto para enviar la instrucción a Antigravity en tu PC.</p></div>';
    return;
  }

  chat.messages.forEach(msg => {
    appendMessageElement(msg.role, msg.content, msg.timestamp, msg.images);
  });
  scrollToBottom();
}

function appendMessageElement(role, content, timestamp, images) {
  const isUser = role === 'user';
  const msgEl = document.createElement('div');
  msgEl.className = 'flex gap-3 ' + (isUser ? 'justify-end' : 'justify-start');

  const renderedHtml = marked.parse(content || '');
  const timeFormatted = new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let imagesHtml = '';
  if (Array.isArray(images) && images.length > 0) {
    imagesHtml = '<div class="flex flex-wrap gap-2 mb-2">' + images.map(imgUrl => '<img src="' + imgUrl + '" class="max-h-56 rounded-xl object-cover border border-indigo-500/30 shadow-md">').join('') + '</div>';
  }

  if (isUser) {
    msgEl.innerHTML = '<div class="flex flex-col items-end max-w-[85%]">' + imagesHtml + (content ? ('<div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md text-sm leading-relaxed whitespace-pre-wrap select-text">' + escapeHtml(content) + '</div>') : '') + '<span class="text-[10px] text-slate-500 mt-1 mr-1">' + timeFormatted + '</span></div>';
  } else {
    msgEl.innerHTML = '<div class="flex gap-2.5 max-w-[92%] sm:max-w-[85%]"><div class="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">AG</div><div class="flex flex-col">' + imagesHtml + '<div class="bg-[#131b2e] border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md prose select-text">' + renderedHtml + '</div><span class="text-[10px] text-slate-500 mt-1 ml-1">' + timeFormatted + '</span></div></div>';
  }

  messagesList.appendChild(msgEl);
  return msgEl;
}

// Create New Chat on PC
function createNewChat() {
  const promptText = prompt('Instrucción inicial para la nueva conversación en Antigravity:', 'Hola');
  if (!promptText) return;

  state.isStreaming = true;
  btnSendMessage.disabled = true;

  messagesList.innerHTML = '<div class="text-center py-16 text-slate-500 space-y-2"><div class="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div><p class="text-xs text-indigo-400 font-bold">Creando conversación en Antigravity PC...</p></div>';

  sendToPC({
    action: 'new_chat',
    prompt: promptText,
    reqId: 'req-new-' + Date.now()
  });
}

btnNewChatHeader.addEventListener('click', createNewChat);
btnNewChatDrawer.addEventListener('click', createNewChat);

// Send Message to PC Antigravity
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (state.isStreaming) return;

  const content = messageInput.value.trim();
  const imagesToSend = [...state.attachedImages];

  if (!content && imagesToSend.length === 0) return;
  if (!state.currentChatId) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  state.attachedImages = [];
  renderImagePreviews();

  // Render User Message immediately
  appendMessageElement('user', content, new Date().toISOString(), imagesToSend.map(i => i.data));
  scrollToBottom();

  state.isStreaming = true;
  btnSendMessage.disabled = true;

  // Render AI streaming placeholder
  const aiMsgContainer = document.createElement('div');
  aiMsgContainer.className = 'flex gap-2.5 max-w-[92%] sm:max-w-[85%] justify-start';
  aiMsgContainer.innerHTML = '<div class="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">AG</div><div class="flex flex-col flex-1"><div class="active-ai-stream-box bg-[#131b2e] border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md prose select-text"><span class="streaming-indicator"></span> Antigravity procesando en tu PC...</div></div>';
  messagesList.appendChild(aiMsgContainer);
  scrollToBottom();

  // Send message command to PC daemon
  sendToPC({
    action: 'send_message',
    chatId: state.currentChatId,
    content: content,
    images: imagesToSend,
    reqId: 'req-msg-' + Date.now()
  });
});

function scrollToBottom() {
  chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

checkAuth();
