// ── STATE ──
var state = JSON.parse(localStorage.getItem('kraftos-state') || '{}');
var startDate = localStorage.getItem('kraftos-start') || new Date().toISOString().split('T')[0];
if (!localStorage.getItem('kraftos-start')) localStorage.setItem('kraftos-start', startDate);

function save() { localStorage.setItem('kraftos-state', JSON.stringify(state)); }
function get(key, def) { return state[key] !== undefined ? state[key] : def; }
function set(key, val) { state[key] = val; save(); }

// ── CHALLENGE DAY ──
function getChallengeDay() {
  var start = new Date(startDate);
  var now = new Date();
  var diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

function updateDayDisplay() {
  var day = getChallengeDay();
  var pct = Math.min(day / 90 * 100, 100);
  var el1 = document.getElementById('sidebar-day');
  var el2 = document.getElementById('topbar-day');
  var bar = document.getElementById('sidebar-progress-fill');
  if (el1) el1.textContent = 'Challenge Day ' + day;
  if (el2) el2.textContent = 'Day ' + day;
  if (bar) bar.style.width = pct + '%';
}

// ── NAVIGATION ──
var currentPage = 'dashboard';
function goPage(page, el) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');
  currentPage = page;
  closeSidebar();
  renderPage(page);
  return false;
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }

// ── UTILS ──
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── DASHBOARD ──
function renderDashboard() {
  renderAccountStats();
  renderWeekStats();
  renderRecentActivity();
}

function statCard(label, val, sub, pct, color) {
  return '<div class="stat-card">' +
    '<div class="stat-card-label">' + label + '</div>' +
    '<div class="stat-card-val">' + val + '</div>' +
    '<div class="stat-card-sub">' + sub + '</div>' +
    '<div class="stat-card-bar"><div class="stat-card-fill" style="width:' + Math.min(pct,100).toFixed(1) + '%;background:' + color + ';"></div></div>' +
    '</div>';
}

function renderAccountStats() {
  var day = getChallengeDay();
  var propCurrent = get('prop-current', '$5,000');
  var propTarget = get('prop-target', '$300');
  var nairaCurrent = get('naira-current', '₦200,000');
  var ig = get('ig-followers', 31);
  var html = '';
  html += statCard('Challenge Day', day, 'since start', day / 90 * 100, 'var(--green)');
  html += statCard('$5K Account', propCurrent, 'target: ' + propTarget, 50, 'var(--green)');
  html += statCard('₦200K Account', nairaCurrent, get('naira-purpose', 'personal / expenses'), 40, '#7F77DD');
  html += statCard('Only1Kraft IG', ig, 'followers', Math.min(ig / 500 * 100, 100), 'var(--gold)');
  document.getElementById('account-stats').innerHTML = html;
}

function progressCard(name, done, target, color, detail) {
  var pct = target > 0 ? Math.min(done / target * 100, 100).toFixed(0) : 0;
  return '<div class="progress-card">' +
    '<div class="progress-card-top"><div class="progress-card-name">' + name + '</div>' +
    '<div class="progress-card-pct" style="color:' + color + '">' + pct + '%</div></div>' +
    '<div class="progress-track"><div class="progress-fill-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
    '<div class="progress-detail">' + detail + '</div>' +
    '</div>';
}

function renderWeekStats() {
  var trades = get('trades', []);
  var now = new Date();
  var weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
  var weekTrades = trades.filter(function(t) {
    if (!t.date) return false;
    return new Date(t.date) >= weekAgo;
  });
  var wins = weekTrades.filter(function(t) { return t.result === 'win'; }).length;
  var losses = weekTrades.filter(function(t) { return t.result === 'loss'; }).length;
  var html = '';
  html += progressCard('Trades this week', weekTrades.length, 3, 'var(--green)', weekTrades.length + ' of 3 max');
  html += progressCard('Win rate', wins, Math.max(wins+losses,1), '#7F77DD', wins + 'W — ' + losses + 'L');
  document.getElementById('week-stats').innerHTML = html;
}

function renderRecentActivity() {
  var trades = get('trades', []);
  var episodes = get('episodes', []);
  var items = [];
  trades.slice(-3).reverse().forEach(function(t) {
    items.push({
      icon: t.result === 'win' ? '✓' : t.result === 'loss' ? '✗' : '·',
      color: t.result === 'win' ? 'var(--green)' : t.result === 'loss' ? 'var(--red)' : 'var(--text2)',
      title: (t.pair || 'Trade') + ' — ' + (t.rr || '') + (t.result ? ' ' + t.result : ''),
      sub: t.notes || 'No notes'
    });
  });
  episodes.slice(-2).reverse().forEach(function(e) {
    items.push({ icon: '▶', color: '#7F77DD', title: 'Kraft Blueprints — ' + (e.title || 'Untitled episode'), sub: e.status || 'In progress' });
  });
  if (items.length === 0) {
    document.getElementById('recent-activity').innerHTML = '<div style="font-size:13px;color:var(--text3);">No activity logged yet. Log your first trade or episode to see it here.</div>';
    return;
  }
  var html = '';
  items.forEach(function(item) {
    html += '<div class="activity-item">';
    html += '<div class="activity-icon" style="color:' + item.color + '">' + item.icon + '</div>';
    html += '<div><div class="activity-title">' + escHtml(item.title) + '</div><div class="activity-sub">' + escHtml(item.sub) + '</div></div>';
    html += '</div>';
  });
  document.getElementById('recent-activity').innerHTML = html;
}

// ── TRADE JOURNAL ──
function renderJournal() {
  var trades = get('trades', []);
  var html = '';
  trades.forEach(function(t, i) {
    html += '<div class="journal-row">';
    html += '<input class="journal-input" type="date" value="' + (t.date||'') + '" oninput="updateTrade(' + i + ',\'date\',this.value)"/>';
    html += '<input class="journal-input journal-pair" placeholder="USDJPY" value="' + escHtml(t.pair||'') + '" oninput="updateTrade(' + i + ',\'pair\',this.value)"/>';
    html += '<input class="journal-input" placeholder="Setup, notes, why you took it..." value="' + escHtml(t.notes||'') + '" oninput="updateTrade(' + i + ',\'notes\',this.value)"/>';
    html += '<input class="journal-input" placeholder="1:5" value="' + escHtml(t.rr||'') + '" oninput="updateTrade(' + i + ',\'rr\',this.value)"/>';
    html += '<select class="journal-result-select ' + (t.result||'') + '" onchange="updateTrade(' + i + ',\'result\',this.value)">';
    html += '<option value="" ' + (!t.result?'selected':'') + '>Pending</option>';
    html += '<option value="win" ' + (t.result==='win'?'selected':'') + '>Win</option>';
    html += '<option value="loss" ' + (t.result==='loss'?'selected':'') + '>Loss</option>';
    html += '<option value="be" ' + (t.result==='be'?'selected':'') + '>Breakeven</option>';
    html += '</select>';
    html += '<button class="journal-remove" onclick="removeTrade(' + i + ')">×</button>';
    html += '</div>';
  });
  document.getElementById('journal-rows').innerHTML = html;
  document.getElementById('weekly-reflection').value = get('weekly-reflection', '');
}

function addTrade() {
  var trades = get('trades', []);
  trades.push({ date: new Date().toISOString().split('T')[0], pair: '', notes: '', rr: '', result: '' });
  set('trades', trades);
  renderJournal();
}
function updateTrade(i, field, val) {
  var trades = get('trades', []);
  if (trades[i]) { trades[i][field] = val; set('trades', trades); }
}
function removeTrade(i) {
  var trades = get('trades', []);
  trades.splice(i, 1);
  set('trades', trades);
  renderJournal();
}
function saveReflection() {
  set('weekly-reflection', document.getElementById('weekly-reflection').value);
}

// ── ACCOUNTS ──
function renderAccounts() {
  document.getElementById('prop-stage').value = get('prop-stage', '');
  document.getElementById('prop-start').value = get('prop-start', '');
  document.getElementById('prop-current').value = get('prop-current', '');
  document.getElementById('prop-target').value = get('prop-target', '');
  document.getElementById('prop-dd').value = get('prop-dd', '');
  document.getElementById('prop-trades').value = get('prop-trades', '');
  document.getElementById('prop-status').value = get('prop-status', 'active');

  document.getElementById('naira-start').value = get('naira-start', '');
  document.getElementById('naira-current').value = get('naira-current', '');
  document.getElementById('naira-pnl').value = get('naira-pnl', '');
  document.getElementById('naira-purpose').value = get('naira-purpose', '');

  document.getElementById('ig-followers').value = get('ig-followers', '');
  document.getElementById('tg-followers').value = get('tg-followers', '');
  document.getElementById('yt-followers').value = get('yt-followers', '');
}

function saveAccounts() {
  set('prop-stage', document.getElementById('prop-stage').value);
  set('prop-start', document.getElementById('prop-start').value);
  set('prop-current', document.getElementById('prop-current').value);
  set('prop-target', document.getElementById('prop-target').value);
  set('prop-dd', document.getElementById('prop-dd').value);
  set('prop-trades', document.getElementById('prop-trades').value);
  set('prop-status', document.getElementById('prop-status').value);

  set('naira-start', document.getElementById('naira-start').value);
  set('naira-current', document.getElementById('naira-current').value);
  set('naira-pnl', document.getElementById('naira-pnl').value);
  set('naira-purpose', document.getElementById('naira-purpose').value);
}

function resetProp() {
  if (!confirm('Reset the $5K challenge? This clears challenge data but keeps your trade journal and everything else.')) return;
  ['prop-stage','prop-start','prop-current','prop-target','prop-dd','prop-trades'].forEach(function(k) {
    set(k, '');
    var el = document.getElementById(k);
    if (el) el.value = '';
  });
  set('prop-status', 'active');
  document.getElementById('prop-status').value = 'active';
}

function saveFollowers() {
  set('ig-followers', document.getElementById('ig-followers').value);
  set('tg-followers', document.getElementById('tg-followers').value);
  set('yt-followers', document.getElementById('yt-followers').value);
  renderAccountStats();
}

// ── KRAFT BLUEPRINTS EPISODES ──
function renderEpisodes() {
  var episodes = get('episodes', [
    {title:'The Anatomy of a Candle: What Most Traders Never Learn', status:'Live'},
    {title:'How One Candle Creates Market Structure (HTF to LTF)', status:'Live'},
    {title:'Market Structure — Full Breakdown', status:'Scripted'}
  ]);
  var html = '';
  episodes.forEach(function(e, i) {
    html += '<div class="episode-card">';
    html += '<div class="episode-num">' + (i+1 < 10 ? '0' : '') + (i+1) + '</div>';
    html += '<input class="episode-title" placeholder="Episode title..." value="' + escHtml(e.title||'') + '" oninput="updateEpisode(' + i + ',\'title\',this.value)"/>';
    html += '<select class="episode-status" onchange="updateEpisode(' + i + ',\'status\',this.value)">';
    ['Idea','Scripted','Recording','Editing','Live'].forEach(function(s) {
      html += '<option' + (e.status === s ? ' selected' : '') + '>' + s + '</option>';
    });
    html += '</select>';
    html += '<button class="episode-remove" onclick="removeEpisode(' + i + ')">×</button>';
    html += '</div>';
  });
  document.getElementById('episode-list').innerHTML = html;
  set('episodes', episodes);
}
function addEpisode() {
  var episodes = get('episodes', []);
  episodes.push({ title: '', status: 'Idea' });
  set('episodes', episodes);
  renderEpisodes();
}
function updateEpisode(i, field, val) {
  var episodes = get('episodes', []);
  if (episodes[i]) { episodes[i][field] = val; set('episodes', episodes); }
}
function removeEpisode(i) {
  var episodes = get('episodes', []);
  episodes.splice(i, 1);
  set('episodes', episodes);
  renderEpisodes();
}

// ── IDEAS ──
var ideas = [
  {cat:'chart',title:'Top-down analysis breakdown',hook:'Post your HTF to LTF walkthrough. Show structure, direction, then execution. Caption: "This is how I read any pair before I touch it."'},
  {cat:'chart',title:'Before and after — trade I took today',hook:'Screenshot the setup before entry, then the result. Raw and honest. Caption: "Structure told me this. Execution confirmed it."'},
  {cat:'chart',title:'Trade I didn\'t take — and why',hook:'Show a setup that looked valid but had a reason to stay out. Caption: "Not every setup deserves your money."'},
  {cat:'chart',title:'FVG breakdown on a live chart',hook:'Circle every FVG on a pair you\'re watching. Explain what each means for direction.'},
  {cat:'chart',title:'One pair, three timeframes',hook:'Same pair — Daily, 4H, 15M. Show how the story changes as you zoom in.'},
  {cat:'chart',title:'This setup from last week — what happened',hook:'Show a setup you posted previously and the actual outcome. Accountability builds trust.'},
  {cat:'chart',title:'Current market structure — bias this week',hook:'Pick your most watched pair. Draw structure clearly. State your bias.'},
  {cat:'chart',title:'The entry I\'m waiting for this week',hook:'Show the exact level you\'re watching and why. Creates anticipation.'},
  {cat:'psych',title:'The day I blew an account',hook:'Raw and honest. What happened, what you felt, what you learned.'},
  {cat:'psych',title:'Why I stopped revenge trading',hook:'The moment you realised chasing losses was making it worse.'},
  {cat:'psych',title:'What trading taught me about patience',hook:'The parallel between waiting for a setup and waiting for anything worth having.'},
  {cat:'psych',title:'The hardest rule I follow — and why',hook:'Your strictest rule. Explain the pain that created it.'},
  {cat:'psych',title:'Monday morning mindset post',hook:'Before the week starts. What you\'re focused on, what you\'re avoiding.'},
  {cat:'psych',title:'I took a loss today — here\'s my reaction',hook:'Post on a losing day. Show you moved on. Rarest content in trading.'},
  {cat:'psych',title:'The difference between a trader and a gambler',hook:'Three specific behavioural differences. Honest, direct.'},
  {cat:'prop',title:'Prop firm challenge — milestone update',hook:'Current P&L, days left, what\'s working. Real progress post.'},
  {cat:'prop',title:'Stage 1 to Stage 2 — the scaling moment',hook:'Screenshot the milestone. Emotion first, then the breakdown.'},
  {cat:'prop',title:'My prop firm rules and how I stick to them',hook:'Daily drawdown limit, max loss, consistency rule.'},
  {cat:'prop',title:'How the funded account is performing',hook:'Monthly P&L post. Real numbers build real credibility.'},
  {cat:'edu',title:'What is a Fair Value Gap — explained simply',hook:'Draw it on a chart. Explain in two sentences.'},
  {cat:'edu',title:'Structure | Direction | Execution — what it means',hook:'Break down your own tagline for new followers.'},
  {cat:'edu',title:'Why most traders lose — the real reason',hook:'Not discipline. Not strategy. The actual reasons.'},
  {cat:'edu',title:'How I read market structure in 60 seconds',hook:'Fast walkthrough. Highs, lows, breaks of structure.'},
  {cat:'edu',title:'The one thing I check before every trade',hook:'Your non-negotiable pre-trade checklist item.'},
  {cat:'edu',title:'Liquidity explained with a real chart',hook:'Show where liquidity sits. Explain why price goes there.'},
  {cat:'life',title:'The system behind the results',hook:'Show the process — analysis, execution, journaling. Clean and polished.'},
  {cat:'life',title:'$5K to $50K — documenting the scale',hook:'Show the roadmap. Where you are now, where it\'s going.'},
  {cat:'life',title:'Why I chose trading as my craft',hook:'Honest reflection, polished delivery. Not a flex — a real answer.'}
];
var ideasFilter = 'all';
function renderIdeas() {
  var cats = ['all','chart','psych','prop','edu','life'];
  var labels = {all:'All', chart:'Chart', psych:'Psychology', prop:'Prop firm', edu:'Education', life:'Authority'};
  var fhtml = cats.map(function(c) {
    return '<button class="idea-filter-btn' + (ideasFilter === c ? ' on' : '') + '" onclick="setIdeasFilter(\'' + c + '\')">' + labels[c] + '</button>';
  }).join('');
  document.getElementById('ideas-filter').innerHTML = fhtml;

  var usedCount = 0;
  var html = '';
  ideas.forEach(function(idea, i) {
    var used = get('idea-used-' + i, false);
    if (used) usedCount++;
    if (ideasFilter !== 'all' && idea.cat !== ideasFilter) return;
    var badgeLabels = {chart:'Chart analysis', psych:'Psychology', prop:'Prop firm', edu:'Education', life:'Authority'};
    html += '<div class="idea-item' + (used ? ' used' : '') + '">';
    html += '<div class="idea-num">' + (i < 9 ? '0' : '') + (i + 1) + '</div>';
    html += '<div class="idea-content">';
    html += '<div class="idea-badge badge-' + idea.cat + '">' + badgeLabels[idea.cat] + '</div>';
    html += '<div class="idea-title">' + idea.title + '</div>';
    html += '<div class="idea-hook">' + idea.hook + '</div>';
    html += '</div>';
    html += '<button class="idea-use-btn" onclick="toggleIdea(' + i + ')">' + (used ? 'Undo' : 'Used') + '</button>';
    html += '</div>';
  });
  document.getElementById('ideas-list').innerHTML = html;
  document.getElementById('ideas-remaining').textContent = (28 - usedCount) + ' remaining';
}
function setIdeasFilter(cat) { ideasFilter = cat; renderIdeas(); }
function toggleIdea(i) { set('idea-used-' + i, !get('idea-used-' + i, false)); renderIdeas(); }

// ── RULES ──
var rules = [
  {text:'<strong>HTF bias first — always.</strong> Start from Daily or 4H. Define structure and direction before any LTF entry. No trade without a clear HTF narrative.'},
  {text:'<strong>Confirm LTF alignment.</strong> Only enter on LTF confirmation that aligns with HTF bias — BOS, liquidity sweep, FVG fill. LTF contradicts HTF = no trade.'},
  {text:'<strong>RR must be 1:5 minimum before entry.</strong> Calculate RR before placing the trade — not after. Under 1:5, skip it.', hard: true},
  {text:'<strong>Enter only at key levels.</strong> Valid zones: order blocks, FVGs, liquidity voids, swept swing highs/lows. Never chase price into open space.'},
  {text:'<strong>Max 3 trades per week.</strong> 3 trades taken — stop. Wait for the new week. More trades do not mean more profit.', hard: true},
  {text:'<strong>Risk exactly 0.7% per trade.</strong> Calculate lot size based on 0.7% of current balance before every trade. Never override.', hard: true},
  {text:'<strong>Stop loss is non-negotiable.</strong> Every trade must have a stop loss at entry. Never widen it. Move to breakeven at 1R.', hard: true},
  {text:'<strong>Overall drawdown ceiling.</strong> If losses approach the prop firm max loss limit — pause. Review. Do not trade until there is clarity.'},
  {text:'<strong>Set it and let it run.</strong> Once placed — entry, SL, TP — leave it. Swing trades need patience.'},
  {text:'<strong>Partial TP at 1:5.</strong> At 1:5 RR, take 50% profit and move SL to breakeven. Let remaining 50% run to 1:10 target.'},
  {text:'<strong>No revenge trading after a loss.</strong> Trade stops out? Close the platform, step away minimum 2 hours.', hard: true},
  {text:'<strong>Log every trade.</strong> Pair, entry, SL, TP, RR, outcome, one sentence why. No logging = no learning.'},
  {text:'<strong>Weekly review every Sunday.</strong> Review every trade taken. What worked, what didn\'t, what to adjust.'},
  {text:'<strong>One trade means nothing. The system does.</strong> Judge performance over minimum 20 trades, not one.'},
  {text:'<strong>Consistency over big wins.</strong> Small consistent gains compound into the next stage and beyond.'},
  {text:'<strong>Keep the brand clean.</strong> Results and figures only on Instagram. No journey posts. Telegram is the real community.'}
];
function renderRules() {
  var html = '';
  rules.forEach(function(r, i) {
    html += '<div class="rule-item' + (r.hard ? ' hard' : '') + '">';
    html += '<div class="rule-num">' + (i < 9 ? '0' : '') + (i + 1) + '</div>';
    html += '<div><div class="rule-text">' + r.text + '</div>';
    if (r.hard) html += '<span class="rule-tag">Hard rule — no exceptions</span>';
    html += '</div></div>';
  });
  document.getElementById('rules-list').innerHTML = html;
}

// ── NOTES & JOURNAL ──
function getTodayKey() { return 'journal-entry-' + new Date().toISOString().split('T')[0]; }

function renderNotes() {
  var todayLabel = new Date().toLocaleDateString('en-NG', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  document.getElementById('notes-today-label').textContent = todayLabel;
  document.getElementById('notes-scratch').value = get('notes-scratch', '');
  var todayEntry = get(getTodayKey(), {q1:'', q2:'', q3:''});
  document.getElementById('journal-q1').value = todayEntry.q1 || '';
  document.getElementById('journal-q2').value = todayEntry.q2 || '';
  document.getElementById('journal-q3').value = todayEntry.q3 || '';
  renderEntriesLog();
}
function saveScratch() { set('notes-scratch', document.getElementById('notes-scratch').value); }
function saveJournalEntry(manual) {
  var entry = {
    q1: document.getElementById('journal-q1').value,
    q2: document.getElementById('journal-q2').value,
    q3: document.getElementById('journal-q3').value,
    date: new Date().toISOString().split('T')[0]
  };
  set(getTodayKey(), entry);
  var index = get('journal-entries-index', []);
  var key = getTodayKey();
  if (index.indexOf(key) === -1) { index.unshift(key); set('journal-entries-index', index); }
  var status = document.getElementById('notes-save-status');
  status.textContent = manual ? 'Saved.' : 'Auto-saved';
  status.classList.add('saved');
  setTimeout(function() { status.classList.remove('saved'); status.textContent = 'Auto-saves as you type'; }, 2000);
  renderEntriesLog();
}
function renderEntriesLog() {
  var index = get('journal-entries-index', []);
  var log = document.getElementById('notes-entries-log');
  var empty = document.getElementById('notes-empty');
  if (index.length === 0) { log.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  var html = '';
  index.forEach(function(key) {
    var entry = get(key, null);
    if (!entry) return;
    var dateStr = entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('en-NG', {weekday:'short', month:'short', day:'numeric', year:'numeric'}) : key.replace('journal-entry-','');
    html += '<div class="notes-entry-card">';
    html += '<div class="notes-entry-date">' + dateStr + '<button class="notes-entry-delete" onclick="deleteEntry(\'' + key + '\')" title="Delete entry">×</button></div>';
    if (entry.q1) { html += '<div class="notes-entry-q"><div class="notes-entry-qlabel">What I did</div><div class="notes-entry-qtext">' + escHtml(entry.q1) + '</div></div>'; }
    if (entry.q2) { html += '<div class="notes-entry-q"><div class="notes-entry-qlabel">What worked / didn\'t</div><div class="notes-entry-qtext">' + escHtml(entry.q2) + '</div></div>'; }
    if (entry.q3) { html += '<div class="notes-entry-q"><div class="notes-entry-qlabel">Tomorrow\'s first move</div><div class="notes-entry-qtext">' + escHtml(entry.q3) + '</div></div>'; }
    html += '</div>';
  });
  log.innerHTML = html;
}
function deleteEntry(key) {
  if (!confirm('Delete this journal entry?')) return;
  var index = get('journal-entries-index', []);
  index = index.filter(function(k) { return k !== key; });
  set('journal-entries-index', index);
  delete state[key];
  save();
  renderEntriesLog();
}

// ── RENDER PAGE ──
function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'journal') renderJournal();
  else if (page === 'accounts') renderAccounts();
  else if (page === 'content') renderEpisodes();
  else if (page === 'ideas') renderIdeas();
  else if (page === 'rules') renderRules();
  else if (page === 'notes') renderNotes();
}

// ── INIT ──
(function init() {
  updateDayDisplay();
  renderDashboard();
  setInterval(updateDayDisplay, 60000);
})();
