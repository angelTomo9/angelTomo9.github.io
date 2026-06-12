/* ============================================
   PORRA MUNDIAL 2026 - v4 con Bonus y Grupos
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {

const USERS = ['ángel','angel','iker','ibai','xavi'];
const CODE = 'charos';
const API_KEY = '44f1435bc3704c82b557fb70255ec7cf';
const API_URL = 'https://api.football-data.org/v4/matches';
const INTERVALO_ACT = 12 * 60 * 60 * 1000;

let usuario = null;
let preds = {};     // { user: { matchId: "home"|"away" } }
let resultados = {};
let logs = [];
let groupsPreds = {};  // { user: { GROUP_A: ["Mexico","Sudafrica"...], ... } }
let bonusPreds = {};   // { user: { campeon, subcampeon, goleador } }
let gruposReales = {}; // { GROUP_A: ["team1","team2","team3","team4"] }
let fbOk = false;

// ===== GRUPOS EXTRAÍDOS DE partidos.js =====
// Se computan al cargar
let gruposData = {};

function computarGrupos() {
    gruposData = {};
    if (!partidos) return;
    for (const p of partidos) {
        if (!p.group) continue;
        if (!gruposData[p.group]) gruposData[p.group] = new Set();
        gruposData[p.group].add(p.homeTeam);
        gruposData[p.group].add(p.awayTeam);
    }
    // Convertir Sets a arrays
    for (const g in gruposData) gruposData[g] = Array.from(gruposData[g]);
}
// Extraer todos los equipos únicos
function todosEquipos() {
    const s = new Set();
    for (const g in gruposData) for (const t of gruposData[g]) s.add(t);
    return Array.from(s).sort();
}

// ===== FIREBASE =====
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
const contDetalle = $('leaderboard-detalle');
const contLogs = $('logs-container');
const contGroups = $('groups-container');
const btnGuardarGroups = $('save-groups-btn');
const btnGuardarBonus = $('save-bonus-btn');
const selectCampeon = $('select-campeon');
const selectSubcampeon = $('select-subcampeon');
const inputGoleador = $('input-goleador');
const lblActualizacion = $('ultima-actualizacion');
const lblClasifInfo = $('clasif-info');
const toastEl = $('toast');

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => { c.classList.remove('active'); c.classList.add('hidden'); });
        btn.classList.add('active');
        const t = $(btn.dataset.target);
        t.classList.remove('hidden'); t.classList.add('active');
        if (btn.dataset.target==='tab-clasificacion') renderClasif();
        if (btn.dataset.target==='tab-logs') renderLogs();
        if (btn.dataset.target==='tab-bonus') renderBonus();
    });
});

// ===== LOGIN =====
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
    userInput.value = ''; codeInput.value = ''; errMsg.classList.add('hidden');
    mainScreen.classList.remove('active'); mainScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden'); loginScreen.classList.add('active');
});

// ===== INICIAR =====
async function iniciar() {
    computarGrupos();
    initFB();
    try { const r = localStorage.getItem('porraPreds'); if (r) preds = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraRes'); if (r) resultados = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraLogs'); if (r) logs = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraGroups'); if (r) groupsPreds = JSON.parse(r); } catch(e){}
    try { const r = localStorage.getItem('porraBonus'); if (r) bonusPreds = JSON.parse(r); } catch(e){}
    
    if (fbOk) {
        try {
            const snap = await firebase.database().ref('/porra').once('value');
            const fb = snap.val();
            if (fb) {
                if (fb.preds) { preds = fb.preds; localStorage.setItem('porraPreds',JSON.stringify(preds)); }
                if (fb.res) { resultados = fb.res; localStorage.setItem('porraRes',JSON.stringify(resultados)); }
                if (fb.logs) { logs = fb.logs; localStorage.setItem('porraLogs',JSON.stringify(logs)); }
                if (fb.groups) { groupsPreds = fb.groups; localStorage.setItem('porraGroups',JSON.stringify(groupsPreds)); }
                if (fb.bonus) { bonusPreds = fb.bonus; localStorage.setItem('porraBonus',JSON.stringify(bonusPreds)); }
            }
        } catch(e){ console.warn('Firebase error:', e); }
    }
    renderPartidos();
    renderGroups();
    renderLogs();
    renderClasif();
    actualizarSiToca();
}

// ===== LOGS =====
function addLog(evento) {
    evento.timestamp = Date.now();
    evento.id = Date.now()+'_'+Math.random().toString(36).substr(2,4);
    logs.unshift(evento);
    if (logs.length > 200) logs = logs.slice(0,200);
    localStorage.setItem('porraLogs', JSON.stringify(logs));
    if (fbOk) firebase.database().ref('/porra/logs').set(logs).catch(()=>{});
}

// ===== ACTUALIZAR RESULTADOS =====
let actualizando = false;
async function actualizarResultados(forzar = false) {
    if (actualizando) return;
    actualizando = true;
    const ultima = localStorage.getItem('porraUltAct');
    if (!forzar && ultima && Date.now()-parseInt(ultima) < INTERVALO_ACT) { actualizando = false; return; }
    
    try {
        const ahora = new Date();
        const ids = partidos.filter(p => new Date(p.utcDate) < ahora && !resultados[p.id]).map(p => p.id);
        if (ids.length === 0) { localStorage.setItem('porraUltAct',Date.now().toString()); actualizando = false; return; }
        
        for (let i = 0; i < ids.length; i += 10) {
            const grupo = ids.slice(i, i+10);
            const resp = await fetch(`${API_URL}?ids=${grupo.join(',')}`,{headers:{'X-Auth-Token':API_KEY}});
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data.matches) {
                for (const m of data.matches) {
                    if (m.status === 'FINISHED' && m.score.winner && !resultados[m.id]) {
                        const winner = m.score.winner;
                        resultados[m.id] = winner;
                        const p = partidos.find(x => x.id === m.id);
                        if (p) {
                            const ganador = winner === 'HOME_TEAM' ? p.homeTeam : winner === 'AWAY_TEAM' ? p.awayTeam : 'Empate';
                            addLog({type:'partido_finalizado',matchId:m.id,mensaje:`⚽ Final: ${p.homeTeam} vs ${p.awayTeam} — Ganador: ${ganador}`});
                            for (const [user,up] of Object.entries(preds)) {
                                const pred = up[m.id];
                                if (!pred) continue;
                                let pts = 0;
                                if (winner==='HOME_TEAM' && pred==='home') pts=3;
                                else if (winner==='AWAY_TEAM' && pred==='away') pts=3;
                                else if (winner==='DRAW') pts=1;
                                const pt = pred==='home'?p.homeTeam:p.awayTeam;
                                addLog({type:'puntos',matchId:m.id,usuario:user,puntos:pts,predijo:pt,mensaje:`👤 ${user}: ${pts>0?`✅+${pts}pts`:'❌0pts'} (predijo ${pt})`});
                            }
                        }
                        const yaCierre = logs.some(l=>l.type==='cierre_apuestas'&&l.matchId===m.id);
                        if (!yaCierre&&p) addLog({type:'cierre_apuestas',matchId:m.id,mensaje:`🔒 Apuestas cerradas: ${p.homeTeam} vs ${p.awayTeam}`});
                    }
                }
            }
        }
        
        // Recalcular clasificación de grupos real
        recalcularGruposReales();
        
        localStorage.setItem('porraRes',JSON.stringify(resultados));
        localStorage.setItem('porraUltAct',Date.now().toString());
        if (fbOk) { await firebase.database().ref('/porra/res').set(resultados); await firebase.database().ref('/porra/logs').set(logs); }
        if (lblActualizacion) lblActualizacion.textContent = `🕐 Actualizado: ${new Date().toLocaleString('es-ES')}`;
        renderPartidos(); renderClasif(); renderLogs();
    } catch(e){ console.error(e); }
    actualizando = false;
}

function actualizarSiToca() {
    const ultima = localStorage.getItem('porraUltAct');
    if (!ultima || Date.now()-parseInt(ultima)>=INTERVALO_ACT) actualizarResultados(false);
    else {
        const diff = Date.now()-parseInt(ultima);
        if (lblActualizacion) lblActualizacion.textContent = `🕐 Actualizado hace ~${Math.floor(diff/3600000)}h`;
        renderPartidos(); renderClasif();
    }
}

// ===== CALCULAR GRUPOS REALES =====
function recalcularGruposReales() {
    gruposReales = {};
    for (const g in gruposData) {
        const teams = gruposData[g];
        // Calcular puntos de cada equipo en el grupo
        const pts = {};
        for (const t of teams) pts[t] = 0;
        
        const matchesG = partidos.filter(p => p.group === g);
        for (const m of matchesG) {
            const win = resultados[m.id];
            if (!win || win === 'null') continue;
            if (win === 'HOME_TEAM') pts[m.homeTeam] += 3;
            else if (win === 'AWAY_TEAM') pts[m.awayTeam] += 3;
            else if (win === 'DRAW') { pts[m.homeTeam] += 1; pts[m.awayTeam] += 1; }
        }
        // Ordenar por puntos descendente
        gruposReales[g] = teams.slice().sort((a,b) => pts[b]-pts[a]);
    }
}

// ===== RENDER PARTIDOS =====
function renderPartidos() {
    if (!contPartidos || !partidos) return;
    const up = (preds[usuario]||{});
    const ahora = new Date();
    let html = '';
    for (const p of partidos) {
        const fp = new Date(p.utcDate);
        const empezo = ahora >= fp;
        const res = resultados[p.id];
        const term = res && res !== 'null';
        const pred = up[p.id];
        const dis = empezo||term?'disabled':'';
        const hsel = pred==='home'?'selected':'';
        const asel = pred==='away'?'selected':'';
        let st = '⏳ Pendiente', sc = '';
        if (term) { st='✅ Finalizado'; sc='finished'; } else if (empezo) { st='🔴 En vivo'; sc='live'; }
        let sn = p.stage.replace(/_/g,' ');
        if (p.group) sn += ` (${p.group})`;
        let ptsh = '';
        if (term && pred) {
            let pts = 0;
            if (res==='HOME_TEAM'&&pred==='home') pts=3; else if (res==='AWAY_TEAM'&&pred==='away') pts=3; else if (res==='DRAW') pts=1;
            ptsh = `<div class="puntos-badge pts-${pts}">${pts===3?'✅+3':pts===1?'🤝+1':'❌0'}</div>`;
        }
        let resh = '';
        if (term) {
            const txt = res==='HOME_TEAM'?`🏆${p.homeTeam}`:res==='AWAY_TEAM'?`🏆${p.awayTeam}`:'🤝Empate';
            resh = `<div style="text-align:center;font-size:.75rem;color:#10b981;margin-top:4px">${txt}</div>`;
        }
        html += `<div class="match-card ${term&&pred?(ptsh.includes('+')?'acierto':'fallo'):''}">
            <div class="match-header"><span>${sn}</span><span class="match-status ${sc}">${st}</span></div>
            <div class="teams-container">
                <div class="team team-selectable ${hsel} ${dis}" data-id="${p.id}" data-team="home"><span class="team-name">${p.homeTeam}</span></div>
                <div class="vs">VS</div>
                <div class="team team-selectable ${asel} ${dis}" data-id="${p.id}" data-team="away"><span class="team-name">${p.awayTeam}</span></div>
            </div>${resh}${ptsh}
        </div>`;
    }
    contPartidos.innerHTML = html;
    contPartidos.querySelectorAll('.team-selectable:not(.disabled)').forEach(el => {
        el.addEventListener('click', function() {
            const p = this.closest('.teams-container');
            p.querySelectorAll('.team-selectable').forEach(t=>t.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// ===== GUARDAR PREDICCIONES =====
btnGuardar.addEventListener('click', async () => {
    if (!usuario) return;
    const ahora = new Date();
    let cambios = false;
    if (!preds[usuario]) preds[usuario] = {};
    contPartidos.querySelectorAll('.match-card').forEach(card => {
        const id = parseInt(card.querySelector('[data-id]')?.dataset.id);
        if (!id) return;
        const p = partidos.find(x=>x.id===id);
        if (!p || ahora>=new Date(p.utcDate)) return;
        const sel = card.querySelector('.team.selected');
        if (sel && preds[usuario][id]!==sel.dataset.team) { preds[usuario][id]=sel.dataset.team; cambios=true; }
    });
    if (!cambios) { toast('ℹ️ Sin cambios'); return; }
    localStorage.setItem('porraPreds',JSON.stringify(preds));
    if (fbOk) try{await firebase.database().ref('/porra/preds').set(preds);}catch(e){}
    toast('✅ Pronósticos guardados');
});

// ===== RENDER GRUPOS =====
function renderGroups() {
    if (!contGroups) return;
    const userGroups = groupsPreds[usuario] || {};
    let html = '';
    for (const g of Object.keys(gruposData).sort()) {
        const teams = userGroups[g] || gruposData[g].slice(); // usar predicción o default
        const real = gruposReales[g];
        
        // Indicador de acierto
        let acertado = false;
        if (real && teams.length === real.length) {
            acertado = teams.every((t,i) => t === real[i]);
        }
        
        html += `<div class="group-card">
            <div class="group-title">${g.replace('GROUP_','GRUPO ')} ${acertado?'✅':''}</div>
            <div class="group-teams" data-group="${g}">`;
        
        teams.forEach((team, i) => {
            const posCls = `pos-${i+1}`;
            html += `<div class="group-team ${posCls}">
                <span class="pos">${i+1}º</span>
                <span class="name">${team}</span>
                <span class="arrows">
                    <button class="arrow-btn move-up" data-group="${g}" data-idx="${i}" ${i===0?'disabled style="opacity:0.3"':''}>▲</button>
                    <button class="arrow-btn move-down" data-group="${g}" data-idx="${i}" ${i===teams.length-1?'disabled style="opacity:0.3"':''}>▼</button>
                </span>
            </div>`;
        });
        
        html += `</div></div>`;
    }
    contGroups.innerHTML = html;
    
    // Eventos flechas
    contGroups.querySelectorAll('.move-up').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            const g = this.dataset.group;
            const idx = parseInt(this.dataset.idx);
            moverEquipo(g, idx, -1);
        });
    });
    contGroups.querySelectorAll('.move-down').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            const g = this.dataset.group;
            const idx = parseInt(this.dataset.idx);
            moverEquipo(g, idx, 1);
        });
    });
}

function moverEquipo(grupo, idx, dir) {
    if (!groupsPreds[usuario]) groupsPreds[usuario] = {};
    if (!groupsPreds[usuario][grupo]) groupsPreds[usuario][grupo] = gruposData[grupo].slice();
    const arr = groupsPreds[usuario][grupo];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    renderGroups();
}

// ===== GUARDAR GRUPOS =====
btnGuardarGroups.addEventListener('click', async () => {
    if (!usuario) return;
    localStorage.setItem('porraGroups',JSON.stringify(groupsPreds));
    if (fbOk) try{await firebase.database().ref('/porra/groups').set(groupsPreds);}catch(e){}
    toast('✅ Orden de grupos guardado');
});

// ===== BONUS =====
function renderBonus() {
    if (!selectCampeon) return;
    const equipos = todosEquipos();
    const userB = bonusPreds[usuario] || {};
    
    // Llenar selects
    selectCampeon.innerHTML = '<option value="">— Selecciona —</option>';
    selectSubcampeon.innerHTML = '<option value="">— Selecciona —</option>';
    for (const eq of equipos) {
        selectCampeon.innerHTML += `<option value="${eq}" ${userB.campeon===eq?'selected':''}>${eq}</option>`;
        selectSubcampeon.innerHTML += `<option value="${eq}" ${userB.subcampeon===eq?'selected':''}>${eq}</option>`;
    }
    inputGoleador.value = userB.goleador || '';
}

btnGuardarBonus.addEventListener('click', async () => {
    if (!usuario) return;
    if (!bonusPreds[usuario]) bonusPreds[usuario] = {};
    bonusPreds[usuario].campeon = selectCampeon.value;
    bonusPreds[usuario].subcampeon = selectSubcampeon.value;
    bonusPreds[usuario].goleador = inputGoleador.value.trim();
    localStorage.setItem('porraBonus',JSON.stringify(bonusPreds));
    if (fbOk) try{await firebase.database().ref('/porra/bonus').set(bonusPreds);}catch(e){}
    toast('✅ Pronósticos extra guardados');
});

// ===== PUNTUACIONES =====
function calcularPts() {
    const pts = {};
    for (const u of USERS) {
        let nom = u.charAt(0).toUpperCase()+u.slice(1).toLowerCase();
        if (nom==='Angel') nom='Ángel';
        pts[nom] = {pts:0, aciertos:0, total:0, grupos:0, bonus:0};
    }
    // Puntos partidos
    for (const [idStr,winner] of Object.entries(resultados)) {
        if (!winner||winner==='null') continue;
        const id = parseInt(idStr);
        for (const [user,up] of Object.entries(preds)) {
            if (!pts[user]) pts[user]={pts:0,aciertos:0,total:0,grupos:0,bonus:0};
            const p = up[id];
            if (!p) continue;
            let puntos=0;
            if (winner==='HOME_TEAM'&&p==='home') puntos=3;
            else if (winner==='AWAY_TEAM'&&p==='away') puntos=3;
            else if (winner==='DRAW') puntos=1;
            pts[user].pts += puntos;
            pts[user].total++;
            if (puntos>0) pts[user].aciertos++;
        }
    }
    // Puntos grupos (5 por grupo completo acertado)
    recalcularGruposReales();
    for (const [user, ug] of Object.entries(groupsPreds)) {
        if (!pts[user]) pts[user]={pts:0,aciertos:0,total:0,grupos:0,bonus:0};
        let gPts = 0;
        for (const g in gruposData) {
            const pred = ug[g];
            const real = gruposReales[g];
            if (pred && real && pred.length===real.length && pred.every((t,i)=>t===real[i])) {
                gPts += 5;
            }
        }
        pts[user].grupos = gPts;
    }
    return pts;
}

function renderClasif() {
    if (!contClasif) return;
    const ptsCalc = calcularPts();
    
    // Añadir bonus (campeón, subcampeón, goleador se calculan al final del mundial)
    // Por ahora mostramos el total de partidos + grupos
    
    const rank = Object.entries(ptsCalc)
        .filter(([u]) => USERS.some(v=>norm(v)===norm(u)))
        .sort((a,b) => (b[1].pts+b[1].grupos) - (a[1].pts+a[1].grupos) || b[1].aciertos - a[1].aciertos);
    
    if (rank.length===0) {
        contClasif.innerHTML = '<div class="glassmorphism" style="padding:2rem;text-align:center;color:#64748b">Esperando resultados...</div>';
        return;
    }
    
    const medals = ['🥇','🥈','🥉'];
    let h = '<div class="leaderboard glassmorphism"><table><thead><tr><th>#</th><th>Jugador</th><th>Pts</th><th>⚽</th><th>📊</th><th>✅</th></tr></thead><tbody>';
    rank.forEach(([user,data],i) => {
        const icon = i<3?medals[i]:`${i+1}.`;
        const hl = i===0?'style="background:rgba(255,215,0,0.08)"':'';
        const total = data.pts+data.grupos;
        const pct = data.total>0?Math.round(data.aciertos/data.total*100):'-';
        h += `<tr ${hl}><td>${icon}</td><td><strong>${user}</strong></td><td class="pts">${total}</td><td>${data.pts}</td><td>${data.grupos}</td><td>${pct}%</td></tr>`;
    });
    h += '</tbody></table></div>';
    contClasif.innerHTML = h;
    
    // Detalle
    let det = '<div class="glassmorphism" style="padding:1rem;font-size:.85rem"><b>Leyenda:</b> ⚽ Pts partidos | 📊 Pts grupos | ✅ Aciertos<br><span style="color:#64748b">🏆 Bonus (campeón/subcampeón/goleador) se añadirán al final del mundial.</span></div>';
    contDetalle.innerHTML = det;
    
    const fin = Object.values(resultados).filter(v=>v&&v!=='null').length;
    if (lblClasifInfo) lblClasifInfo.textContent = `📊 ${fin} partidos finalizados de ${partidos.length}`;
}

// ===== LOGS =====
function renderLogs() {
    if (!contLogs) return;
    if (!logs||logs.length===0) {
        contLogs.innerHTML = '<div class="glassmorphism" style="padding:2rem;text-align:center;color:#64748b">⏳ Esperando eventos...</div>';
        return;
    }
    let html = '';
    for (const log of logs) {
        const f = new Date(log.timestamp);
        const h = f.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        let ic='📌', cl='';
        if (log.type==='partido_finalizado'){ic='⚽';cl='log-partido';}
        else if (log.type==='puntos'){ic=log.puntos>0?'✅':'❌';cl=log.puntos>0?'log-acierto':'log-fallo';}
        else if (log.type==='cierre_apuestas'){ic='🔒';cl='log-cierre';}
        else if (log.type==='sistema'){ic='🔄';cl='log-sistema';}
        html += `<div class="log-entry ${cl}"><span class="log-hora">${h}</span><span class="log-icono">${ic}</span><span class="log-msg">${log.mensaje}</span></div>`;
    }
    contLogs.innerHTML = html;
}

// ===== TOAST =====
function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    setTimeout(()=>toastEl.classList.add('hidden'),3000);
}

// ===== AUTO =====
setInterval(()=>{
    const ult = localStorage.getItem('porraUltAct');
    if (ult && Date.now()-parseInt(ult)>=INTERVALO_ACT) actualizarResultados(false);
},30*60*1000);
setInterval(()=>{if($('tab-partidos')?.classList.contains('active')) renderPartidos();},60000);

// ===== AUTO-LOGIN =====
const stored = localStorage.getItem('porraUser');
if (stored && USERS.includes(norm(stored))) {
    usuario = stored;
    displayUser.textContent = `👤 ${usuario}`;
    loginScreen.classList.remove('active'); loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden'); mainScreen.classList.add('active');
    iniciar();
}

console.log('🏆 Porra Mundial 2026 v4 cargada');
});
