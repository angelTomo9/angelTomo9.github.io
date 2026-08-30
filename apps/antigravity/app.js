
const REQUIRED_PASSWORD = "3789bt25";

const state = {
  isAuthenticated: localStorage.getItem('ag_auth_pass') === REQUIRED_PASSWORD,
  apiKey: localStorage.getItem('ag_gemini_key') || '',
  currentProjectId: localStorage.getItem('ag_proj_id') || 'all',
  currentChatId: localStorage.getItem('ag_chat_id') || null,
  projects: [],
  chats: [],
  filteredChats: [],
  attachedImages: [],
  isStreaming: false
};

// Markdown setup
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

const keyModal = document.getElementById('keyModal');
const btnOpenKeyHeader = document.getElementById('btnOpenKeyHeader');
const btnCloseKeyModal = document.getElementById('btnCloseKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const btnSaveApiKey = document.getElementById('btnSaveApiKey');
const keyStatusMsg = document.getElementById('keyStatusMsg');

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
    initApp();
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = loginPinInput.value.trim();
  if (val === REQUIRED_PASSWORD) {
    state.isAuthenticated = true;
    localStorage.setItem('ag_auth_pass', REQUIRED_PASSWORD);
    loginModal.classList.add('hidden');
    initApp();
  } else {
    loginError.textContent = 'Contraseña incorrecta';
    loginError.classList.remove('hidden');
  }
});

// Key Modal Controls
function openKeyModal() {
  apiKeyInput.value = state.apiKey || '';
  keyStatusMsg.textContent = state.apiKey ? '✓ Clave guardada en este dispositivo.' : '';
  keyStatusMsg.className = 'text-xs ' + (state.apiKey ? 'text-emerald-400' : 'text-slate-400');
  keyModal.classList.remove('hidden');
}

function closeKeyModal() {
  keyModal.classList.add('hidden');
}

if (btnOpenKeyHeader) btnOpenKeyHeader.addEventListener('click', openKeyModal);
if (btnCloseKeyModal) btnCloseKeyModal.addEventListener('click', closeKeyModal);

if (btnSaveApiKey) {
  btnSaveApiKey.addEventListener('click', async () => {
    const enteredKey = apiKeyInput.value.trim();
    if (!enteredKey) {
      keyStatusMsg.textContent = 'Introduce una clave válida.';
      keyStatusMsg.className = 'text-xs text-rose-400';
      return;
    }

    btnSaveApiKey.disabled = true;
    keyStatusMsg.textContent = 'Comprobando clave con Google...';
    keyStatusMsg.className = 'text-xs text-indigo-400';

    try {
      const testRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(enteredKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hola' }] }] })
      });

      if (!testRes.ok) {
        const err = await testRes.json();
        throw new Error(err.error?.message || 'Clave no válida');
      }

      state.apiKey = enteredKey;
      localStorage.setItem('ag_gemini_key', enteredKey);
      keyStatusMsg.textContent = '✅ ¡Clave correcta y guardada!';
      keyStatusMsg.className = 'text-xs text-emerald-400 font-bold';
      setTimeout(() => closeKeyModal(), 1200);
    } catch (err) {
      keyStatusMsg.textContent = '❌ Error: ' + err.message;
      keyStatusMsg.className = 'text-xs text-rose-400';
    } finally {
      btnSaveApiKey.disabled = false;
    }
  });
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

// App Init & Data Load
async function initApp() {
  try {
    const localSaved = localStorage.getItem('ag_saved_data');
    let allData = null;
    if (localSaved) {
      allData = JSON.parse(localSaved);
    } else {
      const res = await fetch('./chats_data.json');
      allData = await res.json();
    }

    state.projects = allData.projects || [];
    state.chats = allData.chats || [];

    renderProjectSelect();
    renderFilteredChats();

    if (state.chats.length > 0) {
      if (!state.currentChatId || !state.chats.some(c => c.id === state.currentChatId)) {
        state.currentChatId = state.chats[0].id;
      }
      loadChat(state.currentChatId);
    } else {
      headerChatTitle.textContent = "Sin conversaciones";
      messagesList.innerHTML = '<div class="text-center py-16 text-slate-500"><p class="text-sm font-bold text-slate-400">Pulsa "+ Nuevo" para comenzar un chat</p></div>';
    }
  } catch (err) {
    console.error('Init error:', err);
    headerChatTitle.textContent = "Error al cargar datos";
  }
}

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
    loadChat(state.currentChatId);
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

    item.innerHTML = '<div class="flex items-center gap-2 overflow-hidden mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + (isActive ? '#818cf8' : '#64748b') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="text-xs font-bold truncate text-slate-100">' + escapeHtml(chat.title) + '</span></div><div class="flex items-center justify-between text-[11px] text-slate-500 pl-5">' + projBadge + '<span>' + (chat.messages ? chat.messages.length : 0) + ' msgs</span></div>';

    item.addEventListener('click', () => {
      state.currentChatId = chat.id;
      localStorage.setItem('ag_chat_id', chat.id);
      renderFilteredChats();
      closeDrawer();
      loadChat(chat.id);
    });

    chatsListContainer.appendChild(item);
  });
}

function createNewChat() {
  const promptText = prompt('Título o mensaje inicial:', 'Nueva conversación');
  if (!promptText) return;

  const newId = 'chat-' + Date.now();
  const currentProj = state.projects.find(p => p.id === state.currentProjectId) || { id: 'scratch', name: 'Scratch' };

  const newChat = {
    id: newId,
    projectId: currentProj.id === 'all' ? 'scratch' : currentProj.id,
    projectName: currentProj.name.replace(/^[📁🌟]\s*/, ''),
    title: promptText.slice(0, 45),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  state.chats.unshift(newChat);
  state.currentChatId = newId;
  localStorage.setItem('ag_chat_id', newId);
  saveData();
  renderFilteredChats();
  closeDrawer();
  loadChat(newId);
}

btnNewChatHeader.addEventListener('click', createNewChat);
btnNewChatDrawer.addEventListener('click', createNewChat);

btnNewProject.addEventListener('click', () => {
  const name = prompt('Nombre del nuevo proyecto:');
  if (!name) return;
  const projId = 'proj-' + name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const newProj = { id: projId, name: '📁 ' + name, chatCount: 0 };
  state.projects.push(newProj);
  state.currentProjectId = projId;
  localStorage.setItem('ag_proj_id', projId);
  saveData();
  renderProjectSelect();
  renderFilteredChats();
});

function saveData() {
  localStorage.setItem('ag_saved_data', JSON.stringify({
    projects: state.projects,
    chats: state.chats
  }));
}

function loadChat(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  headerChatTitle.textContent = chat.title || 'Conversación';
  if (chat.projectName) headerProjectName.textContent = chat.projectName;

  messagesList.innerHTML = '';
  if (!chat.messages || chat.messages.length === 0) {
    messagesList.innerHTML = '<div class="text-center py-16 text-slate-500 space-y-2"><p class="text-sm font-bold text-slate-400">Conversación lista</p><p class="text-xs text-slate-600">Escribe o adjunta una foto para conversar.</p></div>';
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

// Prepare alternating contents for Gemini API (user -> model -> user -> model)
function prepareGeminiContents(history, currentPrompt, attachedImages) {
  const contents = [];
  let lastRole = null;

  const recentMessages = (history || []).slice(-10);
  for (const msg of recentMessages) {
    if (!msg.content || typeof msg.content !== 'string') continue;
    const role = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
    const text = msg.content.trim();
    if (!text) continue;

    if (role === lastRole) {
      contents[contents.length - 1].parts[0].text += '

' + text;
    } else {
      contents.push({
        role: role,
        parts: [{ text: text }]
      });
      lastRole = role;
    }
  }

  const currentParts = [];
  if (currentPrompt && currentPrompt.trim()) {
    currentParts.push({ text: currentPrompt.trim() });
  }

  if (Array.isArray(attachedImages)) {
    attachedImages.forEach(img => {
      if (!img.data) return;
      const mimeMatch = img.data.match(/^data:(image/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = img.data.replace(/^data:image/\w+;base64,/, '');
      currentParts.push({
        inlineData: { mimeType: mimeType, data: base64Data }
      });
    });
  }

  if (currentParts.length === 0) {
    currentParts.push({ text: 'Hola' });
  }

  if (lastRole === 'user') {
    contents[contents.length - 1].parts.push(...currentParts);
  } else {
    contents.push({ role: 'user', parts: currentParts });
  }

  return contents;
}

async function generateAIResponse(chat, promptText, attachedImages) {
  let apiKey = (state.apiKey || '').trim();
  if (!apiKey) {
    openKeyModal();
    throw new Error('Debes introducir tu clave gratuita de Google AI Studio (Gemini). Pulsa en el icono de la llave (🔑) arriba.');
  }

  const contents = prepareGeminiContents(chat.messages, promptText, attachedImages);

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || ('HTTP ' + res.status));
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err;
      console.warn('Model ' + model + ' error:', err.message);
    }
  }

  throw new Error('Error en Gemini API: ' + (lastError?.message || 'Revisa tu clave en el icono 🔑'));
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (state.isStreaming) return;

  const content = messageInput.value.trim();
  const imagesToSend = [...state.attachedImages];

  if (!content && imagesToSend.length === 0) return;
  if (!state.currentChatId) return;

  const currentChat = state.chats.find(c => c.id === state.currentChatId);
  if (!currentChat) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  state.attachedImages = [];
  renderImagePreviews();

  const userMsg = {
    id: 'msg-u-' + Date.now(),
    role: 'user',
    content: content,
    images: imagesToSend.map(i => i.data),
    timestamp: new Date().toISOString()
  };

  currentChat.messages.push(userMsg);
  appendMessageElement(userMsg.role, userMsg.content, userMsg.timestamp, userMsg.images);
  scrollToBottom();

  state.isStreaming = true;
  btnSendMessage.disabled = true;

  const aiPlaceholder = document.createElement('div');
  aiPlaceholder.className = 'flex gap-2.5 max-w-[92%] sm:max-w-[85%] justify-start';
  aiPlaceholder.innerHTML = '<div class="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">AG</div><div class="bg-[#131b2e] border border-slate-800 text-slate-400 rounded-2xl px-4 py-3 shadow-md text-xs">Generando respuesta...</div>';
  messagesList.appendChild(aiPlaceholder);
  scrollToBottom();

  try {
    const replyText = await generateAIResponse(currentChat, content, imagesToSend);
    messagesList.removeChild(aiPlaceholder);

    const aiMsg = {
      id: 'msg-a-' + Date.now(),
      role: 'model',
      content: replyText,
      timestamp: new Date().toISOString()
    };
    currentChat.messages.push(aiMsg);
    appendMessageElement(aiMsg.role, aiMsg.content, aiMsg.timestamp);
    saveData();
  } catch (err) {
    messagesList.removeChild(aiPlaceholder);
    appendMessageElement('model', '❌ **' + err.message + '**\n\n*Haz clic en el botón de la llave (🔑) arriba a la derecha para verificar o cambiar tu clave.*');
  } finally {
    state.isStreaming = false;
    btnSendMessage.disabled = false;
    scrollToBottom();
  }
});

function scrollToBottom() {
  chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Kickstart auth
checkAuth();
