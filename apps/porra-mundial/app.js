/* ============================================
   PORRA MUNDIAL 2026 - v3 con Historial
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {

const USERS = ['ángel','angel','iker','ibai','xavi'];
const CODE = 'charos';
const API_KEY = '44f1435bc3704c82b557fb70255ec7cf';
const API_URL = 'https://api.football-data.org/v4/matches';
const INTERVALO_ACT = 12 * 60 * 60 * 1000;

let usuario = null;
let preds = {};
let resultados = {};
let logs = [];
let fbOk = false;

function initFB() {
    if (typeof firebase==='undefined' || !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey==='TU_API_KEY') return false;
    try { if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); fbOk = true; return true; } catch(e){ return false; }
}

const $ = id => document.getElementById(id);
const loginScreen = $('login-screen');
const mainScreen = $('main-screen');
const loginForm = $('login-form');
const userInput = $('username');
const codeInput = $('secret-code');
const errMsg = $('error-message');
const displayUser = $('display-user');
const logoutBtn = $('logout-btn');
const contPartidos = $('matches-container');
const btnGuardar = $('save-predictions-btn');
const contClasif = $('leaderboard-container');
const contResumen = $('user-predictions-summary');
const contLogs = $('logs-container');
const lblActualizacion = $('ultima-actualizacion');
const lblClasifInfo = $('clasif-info');
const toastEl = $('toast');

// TABS
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => { c.classList.remove('active'); c.classList.add('hidden'); });
        btn.classList.add('active');
        const t = $(btn.dataset.target);
        t.classList.remove('hidden'); t.classList.add('active');
        if (btn.dataset.target==='tab-clasificacion') renderClasif();
        if (btn.dataset.target==='tab-logs') renderLogs();
    });
});

// LOGIN
function norm(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }

loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = userInput.value.trim();
    const pwd = codeInput.value.trim();
    if (USERS.includes(norm(name)) && pwd === CODE) {
        errMsg.classList.add('hidden');
        usuario = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        if (norm(usuario)==='angel') usuario = 'Ángel';
        localStorage.setItem('porraUser', usuario);
        displayUser.textContent = `👤 ${usuario}`;
        loginScreen.classList.remove('active'); loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden'); mainScreen.classList.add('active');
        iniciar();
    } else {
        errMsg.textContent = '❌ Nombre o código incorrecto';
        errMsg.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('porraUser'); usuario = null;
    userInput.value = ''; codeInput.value = '';
    errMsg.classList.add('hidden');
    mainScreen.classList.remove('active'); mainScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden'); loginScreen.classList.add('active');
});

// INICIAR
async function iniciar() {
    initFB();
    try { const r = localStorage.getItem('porraPreds'); if (r) preds = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraRes'); if (r) resultados = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraLogs'); if (r) logs = JSON.parse(r); } catch(e){}
    
    if (fbOk) {
        try {
            const snap = await firebase.database().ref('/porra').once('value');
            const fb = snap.val();
            if (fb) {
                if (fb.preds) { preds = fb.preds; localStorage.setItem('porraPreds',JSON.stringify(preds)); }
                if (fb.res) { resultados = fb.res; localStorage.setItem('porraRes',JSON.stringify(resultados)); }
                if (fb.logs) { logs = fb.logs; localStorage.setItem('porraLogs',JSON.stringify(logs)); }
            }
        } catch(e){ console.warn('Firebase error:', e); }
    }
    renderPartidos();
    renderLogs();
    actualizarSiToca();
}

// LOGS
function addLog(evento) {
    evento.timestamp = Date.now();
    evento.id = Date.now() + '_' + Math.random().toString(36).substr(2,4);
    logs.unshift(evento);
    // Mantener max 200 logs
    if (logs.length > 200) logs = logs.slice(0, 200);
    localStorage.setItem('porraLogs', JSON.stringify(logs));
    if (fbOk) firebase.database().ref('/porra/logs').set(logs).catch(()=>{});
}

// ACTUALIZAR RESULTADOS
let actualizando = false;

async function actualizarResultados(forzar = false) {
    if (actualizando) return;
    actualizando = true;
    
    const ultima = localStorage.getItem('porraUltAct');
    if (!forzar && ultima && Date.now() - parseInt(ultima) < INTERVALO_ACT) { actualizando = false; return; }
    
    try {
        const ahora = new Date();
        const ids = partidos.filter(p => new Date(p.utcDate) < ahora && !resultados[p.id]).map(p => p.id);
        
        if (ids.length === 0) {
            localStorage.setItem('porraUltAct', Date.now().toString());
            actualizando = false;
            return;
        }
        
        let nuevosResultados = 0;
        
        for (let i = 0; i < ids.length; i += 10) {
            const grupo = ids.slice(i, i+10);
            const resp = await fetch(`${API_URL}?ids=${grupo.join(',')}`, { headers: { 'X-Auth-Token': API_KEY } });
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data.matches) {
                for (const m of data.matches) {
                    if (m.status === 'FINISHED' && m.score.winner && !resultados[m.id]) {
                        const winner = m.score.winner;
                        const homeScore = m.score.fullTime?.home ?? 0;
                        const awayScore = m.score.fullTime?.away ?? 0;
                        resultados[m.id] = winner;
                        nuevosResultados++;
                        
                        // Log: partido finalizado
                        const p = partidos.find(x => x.id === m.id);
                        if (p) {
                            const ganador = winner === 'HOME_TEAM' ? p.homeTeam : winner === 'AWAY_TEAM' ? p.awayTeam : 'Empate';
                            addLog({
                                type: 'partido_finalizado',
                                matchId: m.id,
                                mensaje: `⚽ Final: ${p.homeTeam} ${homeScore}-${awayScore} ${p.awayTeam} — Ganador: ${ganador}`
                            });
                            
                            // Log: puntos de cada usuario
                            for (const [user, userPreds] of Object.entries(preds)) {
                                const pred = userPreds[m.id];
                                if (!pred) continue;
                                let pts = 0;
                                if (winner === 'HOME_TEAM' && pred === 'home') pts = 3;
                                else if (winner === 'AWAY_TEAM' && pred === 'away') pts = 3;
                                else if (winner === 'DRAW') pts = 1;
                                
                                const predTxt = pred === 'home' ? p.homeTeam : p.awayTeam;
                                addLog({
                                    type: 'puntos',
                                    matchId: m.id,
                                    usuario: user,
                                    puntos: pts,
                                    predijo: predTxt,
                                    mensaje: `👤 ${user}: ${pts > 0 ? `✅ +${pts} pts` : '❌ 0 pts'} (predijo ${predTxt})`
                                });
                            }
                        }
                        
                        // Log: cierre de apuestas (si no se había registrado antes)
                        const yaHayCierre = logs.some(l => l.type === 'cierre_apuestas' && l.matchId === m.id);
                        if (!yaHayCierre) {
                            const p2 = partidos.find(x => x.id === m.id);
                            if (p2) {
                                addLog({
                                    type: 'cierre_apuestas',
                                    matchId: m.id,
                                    mensaje: `🔒 Apuestas cerradas: ${p2.homeTeam} vs ${p2.awayTeam}`
                                });
                            }
                        }
                    }
                }
            }
        }
        
        if (nuevosResultados > 0) {
            addLog({ type: 'sistema', mensaje: `🔄 Actualización automática: ${nuevosResultados} partido(s) procesado(s)` });
        }
        
        localStorage.setItem('porraRes', JSON.stringify(resultados));
        localStorage.setItem('porraUltAct', Date.now().toString());
        if (fbOk) {
            await firebase.database().ref('/porra/res').set(resultados);
            await firebase.database().ref('/porra/logs').set(logs);
        }
        
        if (lblActualizacion) lblActualizacion.textContent = `🕐 Actualizado: ${new Date().toLocaleString('es-ES')}`;
        renderPartidos();
        renderClasif();
        renderLogs();
        
    } catch(e) { console.error(e); }
    actualizando = false;
}

function actualizarSiToca() {
    const ultima = localStorage.getItem('porraUltAct');
    if (!ultima || Date.now() - parseInt(ultima) >= INTERVALO_ACT) actualizarResultados(false);
    else {
        const diff = Date.now() - parseInt(ultima);
        const horas = Math.floor(diff / 3600000);
        if (lblActualizacion) lblActualizacion.textContent = `🕐 Actualizado hace ~${horas}h`;
        renderPartidos(); renderClasif();
    }
}

// RENDER PARTIDOS
function renderPartidos() {
    if (!contPartidos || !partidos) return;
    const userPreds = (preds[usuario] || {});
    const ahora = new Date();
    let html = '';
    
    for (const p of partidos) {
        const fechaP = new Date(p.utcDate);
        const empezo = ahora >= fechaP;
        const res = resultados[p.id];
        const terminado = res && res !== 'null';
        const pred = userPreds[p.id];
        const disabled = (empezo || terminado) ? 'disabled' : '';
        const homeSel = pred === 'home' ? 'selected' : '';
        const awaySel = pred === 'away' ? 'selected' : '';
        
        let statusTxt = '⏳ Pendiente', statusCls = '';
        if (terminado) { statusTxt = '✅ Finalizado'; statusCls = 'finished'; }
        else if (empezo) { statusTxt = '🔴 En vivo'; statusCls = 'live'; }
        
        let stageName = p.stage.replace(/_/g,' ');
        if (p.group) stageName += ` (${p.group})`;
        
        let ptsHtml = '';
        if (terminado && pred) {
            let pts = 0;
            if (res === 'HOME_TEAM' && pred === 'home') pts = 3;
            else if (res === 'AWAY_TEAM' && pred === 'away') pts = 3;
            else if (res === 'DRAW') pts = 1;
            ptsHtml = `<div class="puntos-badge pts-${pts}">${pts === 3 ? '✅ +3' : pts === 1 ? '🤝 +1' : '❌ 0'}</div>`;
        }
        
        let resHtml = '';
        if (terminado) {
            const txt = res === 'HOME_TEAM' ? `🏆 ${p.homeTeam}` : res === 'AWAY_TEAM' ? `🏆 ${p.awayTeam}` : '🤝 Empate';
            resHtml = `<div style="text-align:center;font-size:.75rem;color:#10b981;margin-top:4px">${txt}</div>`;
        }
        
        html += `<div class="match-card ${terminado && pred ? (ptsHtml.includes('+') ? 'acierto' : 'fallo') : ''}">
            <div class="match-header">
                <span>${stageName}</span>
                <span class="match-status ${statusCls}">${statusTxt}</span>
            </div>
            <div class="teams-container">
                <div class="team team-selectable ${homeSel} ${disabled}" data-id="${p.id}" data-team="home">
                    <span class="team-name">${p.homeTeam}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team team-selectable ${awaySel} ${disabled}" data-id="${p.id}" data-team="away">
                    <span class="team-name">${p.awayTeam}</span>
                </div>
            </div>
            ${resHtml}
            ${ptsHtml}
        </div>`;
    }
    contPartidos.innerHTML = html;
    contPartidos.querySelectorAll('.team-selectable:not(.disabled)').forEach(el => {
        el.addEventListener('click', function() {
            const parent = this.closest('.teams-container');
            parent.querySelectorAll('.team-selectable').forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// GUARDAR PREDICCIONES
btnGuardar.addEventListener('click', async () => {
    if (!usuario) return;
    const ahora = new Date();
    let cambios = false;
    if (!preds[usuario]) preds[usuario] = {};
    
    contPartidos.querySelectorAll('.match-card').forEach(card => {
        const id = parseInt(card.querySelector('[data-id]')?.dataset.id);
        if (!id) return;
        const p = partidos.find(x => x.id === id);
        if (!p || ahora >= new Date(p.utcDate)) return;
        const sel = card.querySelector('.team.selected');
        if (sel && preds[usuario][id] !== sel.dataset.team) {
            preds[usuario][id] = sel.dataset.team;
            cambios = true;
        }
    });
    
    if (!cambios) { toast('ℹ️ Sin cambios'); return; }
    localStorage.setItem('porraPreds', JSON.stringify(preds));
    if (fbOk) { try { await firebase.database().ref('/porra/preds').set(preds); } catch(e){} }
    toast('✅ Pronósticos guardados');
});

// PUNTUACIONES
function calcularPts() {
    const pts = {};
    for (const u of USERS) {
        let nom = u.charAt(0).toUpperCase() + u.slice(1).toLowerCase();
        if (nom === 'Angel') nom = 'Ángel';
        pts[nom] = { pts: 0, aciertos: 0, total: 0 };
    }
    for (const [idStr, winner] of Object.entries(resultados)) {
        if (!winner || winner === 'null') continue;
        const id = parseInt(idStr);
        for (const [user, userPreds] of Object.entries(preds)) {
            if (!pts[user]) pts[user] = { pts: 0, aciertos: 0, total: 0 };
            const p = userPreds[id];
            if (!p) continue;
            let puntos = 0;
            if (winner === 'HOME_TEAM' && p === 'home') puntos = 3;
            else if (winner === 'AWAY_TEAM' && p === 'away') puntos = 3;
            else if (winner === 'DRAW') puntos = 1;
            pts[user].pts += puntos;
            pts[user].total++;
            if (puntos > 0) pts[user].aciertos++;
        }
    }
    return pts;
}

function renderClasif() {
    if (!contClasif) return;
    const pts = calcularPts();
    const rank = Object.entries(pts).filter(([u]) => USERS.some(v => norm(v) === norm(u))).sort((a,b) => b[1].pts - a[1].pts || b[1].aciertos - a[1].aciertos);
    
    if (rank.length === 0) {
        contClasif.innerHTML = '<div class="glassmorphism" style="padding:2rem;text-align:center;color:#64748b">Esperando resultados...</div>';
        return;
    }
    
    const medals = ['🥇','🥈','🥉'];
    let h = '<div class="leaderboard glassmorphism"><table><thead><tr><th>#</th><th>Jugador</th><th>Pts</th><th>✅</th><th>🎯</th></tr></thead><tbody>';
    rank.forEach(([user, data], i) => {
        const icon = i < 3 ? medals[i] : `${i+1}.`;
        const hl = i === 0 ? 'style="background:rgba(255,215,0,0.08)"' : '';
        const pct = data.total > 0 ? Math.round(data.aciertos/data.total*100) : '-';
        h += `<tr ${hl}><td>${icon}</td><td><strong>${user}</strong></td><td class="pts">${data.pts}</td><td>${data.aciertos}/${data.total}</td><td>${pct}%</td></tr>`;
    });
    h += '</tbody></table></div>';
    contClasif.innerHTML = h;
    
    const totalFin = Object.values(resultados).filter(v => v && v !== 'null').length;
    if (lblClasifInfo) lblClasifInfo.textContent = `📊 ${totalFin} partidos finalizados de ${partidos.length}`;
    renderResumen();
}

function renderResumen() {
    if (!contResumen || !usuario) return;
    const userPreds = preds[usuario] || {};
    const entries = Object.entries(userPreds).filter(([id]) => resultados[id] && resultados[id] !== 'null');
    if (entries.length === 0) {
        contResumen.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem">Aún no hay resultados</div>';
        return;
    }
    let h = '';
    for (const [idStr, pred] of entries) {
        const p = partidos.find(x => x.id == idStr);
        if (!p) continue;
        const winner = resultados[idStr];
        let pts = 0;
        if (winner === 'HOME_TEAM' && pred === 'home') pts = 3;
        else if (winner === 'AWAY_TEAM' && pred === 'away') pts = 3;
        else if (winner === 'DRAW') pts = 1;
        const predTxt = pred === 'home' ? p.homeTeam : p.awayTeam;
        const winTxt = winner === 'HOME_TEAM' ? p.homeTeam : winner === 'AWAY_TEAM' ? p.awayTeam : 'Empate';
        h += `<div class="match-card ${pts > 0 ? 'acierto' : 'fallo'}" style="padding:0.6rem 1rem;flex-direction:row;align-items:center;gap:0.5rem;font-size:0.85rem">
            <span style="flex:1">${p.homeTeam} vs ${p.awayTeam}</span>
            <span style="color:#94a3b8">Tu: <strong>${predTxt}</strong></span>
            <span style="color:#10b981">Real: ${winTxt}</span>
            <span style="font-weight:800;color:${pts>0?'#10b981':'#ef4444'}">${pts>0?`+${pts}`:'0'}</span>
        </div>`;
    }
    contResumen.innerHTML = h;
}

// LOGS
function renderLogs() {
    if (!contLogs) return;
    if (!logs || logs.length === 0) {
        contLogs.innerHTML = '<div class="glassmorphism" style="padding:2rem;text-align:center;color:#64748b">⏳ Esperando eventos...<br><br>Cuando terminen partidos o se asignen puntos, aparecerán aquí.</div>';
        return;
    }
    
    let html = '';
    for (const log of logs) {
        const fecha = new Date(log.timestamp);
        const hora = fecha.toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        let icono = '📌';
        let color = '';
        if (log.type === 'partido_finalizado') { icono = '⚽'; color = 'log-partido'; }
        else if (log.type === 'puntos') { icono = log.puntos > 0 ? '✅' : '❌'; color = log.puntos > 0 ? 'log-acierto' : 'log-fallo'; }
        else if (log.type === 'cierre_apuestas') { icono = '🔒'; color = 'log-cierre'; }
        else if (log.type === 'sistema') { icono = '🔄'; color = 'log-sistema'; }
        
        html += `<div class="log-entry ${color}">
            <span class="log-hora">${hora}</span>
            <span class="log-icono">${icono}</span>
            <span class="log-msg">${log.mensaje}</span>
        </div>`;
    }
    contLogs.innerHTML = html;
}

// TOAST
function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

// AUTO-UPDATE
setInterval(() => {
    const ult = localStorage.getItem('porraUltAct');
    if (ult && Date.now() - parseInt(ult) >= INTERVALO_ACT) actualizarResultados(false);
}, 30 * 60 * 1000);
setInterval(() => { if ($('tab-partidos')?.classList.contains('active')) renderPartidos(); }, 60000);

// AUTO-LOGIN
const stored = localStorage.getItem('porraUser');
if (stored && USERS.includes(norm(stored))) {
    usuario = stored;
    displayUser.textContent = `👤 ${usuario}`;
    loginScreen.classList.remove('active'); loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden'); mainScreen.classList.add('active');
    iniciar();
}

console.log('🏆 Porra Mundial 2026 v3 cargada');
});
