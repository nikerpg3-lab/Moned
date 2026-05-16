// =============================================
// FINANCE TRACKER — app.js
// Stocare: localStorage | Fără server, fără cloud
// =============================================

// --- Categorii disponibile per tip ---
const CATEGORIES = {
  income: [
    'Salariu / Bacșiș',
    'Freelance',
    'Cadou primit',
    'Vânzare',
    'Chirie încasată',
    'Altele (venit)',
  ],
  expense: [
    'Mâncare & Băuturi',
    'Ieșiri & Distracție',
    'Haine & Accesorii',
    'Transport',
    'Telefon & Internet',
    'Sănătate',
    'Educație',
    'Diverse',
  ],
  investment: [
    'ETF S&P 500 (VUAA/CSPX)',
    'ETF Global (VWCE)',
    'Acțiuni individuale',
    'Fond de urgenta',
    'Fond pentru Beach, Please!',
    'Altele (investiție)',
  ],
};

// --- Starea curentă a tipului selectat ---
let currentType = 'income';

// --- Încarcă tranzacțiile din localStorage ---
function loadTransactions() {
  const raw = localStorage.getItem('fp_transactions');
  return raw ? JSON.parse(raw) : [];
}

// --- Salvează tranzacțiile în localStorage ---
function saveTransactions(transactions) {
  localStorage.setItem('fp_transactions', JSON.stringify(transactions));
}

// --- Formatare sumă cu 2 zecimale și separator mii ---
function formatAmount(amount) {
  return amount.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' lei';
}

// --- Formatare dată în format românesc ---
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

// --- Setează tipul activ (income / expense) și actualizează UI-ul formularului ---
function setType(type) {
  currentType = type;

  const btnIncome     = document.getElementById('btn-income');
  const btnExpense    = document.getElementById('btn-expense');
  const btnInvestment = document.getElementById('btn-investment');
  const btnSubmit     = document.getElementById('btn-submit');

  // Resetează clasele toggle
  btnIncome.className     = 'type-btn';
  btnExpense.className    = 'type-btn';
  btnInvestment.className = 'type-btn';

  if (type === 'income') {
    btnIncome.classList.add('active-income');
    btnSubmit.textContent = 'Adaugă Venit';
    btnSubmit.className   = 'btn-add income-mode';
  } else if (type === 'expense') {
    btnExpense.classList.add('active-expense');
    btnSubmit.textContent = 'Adaugă Cheltuială';
    btnSubmit.className   = 'btn-add expense-mode';
  } else {
    btnInvestment.classList.add('active-investment');
    btnSubmit.textContent = 'Înregistrează Investiție';
    btnSubmit.className   = 'btn-add investment-mode';
  }

  // Actualizează categoriile din dropdown
  populateCategories(type);

  // Șterge mesajul de eroare la schimbarea tipului
  document.getElementById('error-msg').textContent = '';
}

// --- Populează dropdown-ul de categorii în funcție de tip ---
function populateCategories(type) {
  const select = document.getElementById('input-category');
  select.innerHTML = '';
  CATEGORIES[type].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// --- Actualizează dashboard-ul cu totaluri și balanță ---
function updateDashboard(transactions) {
  const incomes     = transactions.filter(t => t.type === 'income');
  const expenses    = transactions.filter(t => t.type === 'expense');
  const investments = transactions.filter(t => t.type === 'investment');

  const totalIncome     = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense    = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalInvestment = investments.reduce((sum, t) => sum + t.amount, 0);
  // Investițiile NU scad balanța — sunt banii tăi, doar în altă formă
  const balance = totalIncome - totalExpense - totalInvestment;

  // Actualizează valorile afișate
  document.getElementById('total-income').textContent     = formatAmount(totalIncome);
  document.getElementById('total-expense').textContent    = formatAmount(totalExpense);
  document.getElementById('total-investment').textContent = formatAmount(totalInvestment);
  document.getElementById('balance').textContent          = formatAmount(Math.abs(balance));

  // Actualizează contoarele
  document.getElementById('count-income').textContent     = `${incomes.length} tranzacț${incomes.length === 1 ? 'ie' : 'ii'}`;
  document.getElementById('count-expense').textContent    = `${expenses.length} tranzacț${expenses.length === 1 ? 'ie' : 'ii'}`;
  document.getElementById('count-investment').textContent = `${investments.length} transfer${investments.length === 1 ? '' : 'uri'}`;
  document.getElementById('total-count').textContent      = `${transactions.length} înregistrăr${transactions.length === 1 ? 'e' : 'i'}`;

  // Culoare dinamică balanță
  const balanceEl   = document.getElementById('balance');
  const balancePill = document.getElementById('balance-label');
  balanceEl.className = 'stat-value balance';

  if (balance > 0) {
    balanceEl.classList.add('positive');
    balancePill.textContent = '↑ surplus';
    balancePill.className   = 'stat-pill pill-green';
    balanceEl.textContent   = formatAmount(balance);
  } else if (balance < 0) {
    balanceEl.classList.add('negative');
    balancePill.textContent = '↓ deficit';
    balancePill.className   = 'stat-pill pill-red';
    balanceEl.textContent   = '−' + formatAmount(Math.abs(balance));
  } else {
    balanceEl.classList.add('zero');
    balancePill.textContent = 'neutru';
    balancePill.className   = 'stat-pill pill-gray';
    balanceEl.textContent   = formatAmount(0);
  }
}

// --- Randează lista de tranzacții ---
function renderList(transactions) {
  const container = document.getElementById('transactions-list');

  // Sortare: cele mai recente primele (după dată, apoi după id)
  const sorted = [...transactions].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });

  if (sorted.length === 0) {
    // Stare goală
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◎</div>
        <p>Nicio tranzacție încă.<br/>Adaugă prima ta înregistrare.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sorted.map(t => {
    const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '↗';
    return `
    <div class="tx-item" id="tx-${t.id}">
      <span class="tx-dot dot-${t.type}"></span>
      <div class="tx-info">
        <p class="tx-cat">${escapeHtml(t.category)}</p>
        <p class="tx-date">${formatDate(t.date)}</p>
      </div>
      <span class="tx-amount ${t.type}">
        ${prefix}${formatAmount(t.amount)}
      </span>
      <button class="tx-delete" onclick="deleteTransaction(${t.id})" aria-label="Șterge tranzacția">✕</button>
    </div>
  `;
  }).join('');
}

// --- Escape HTML pentru a preveni XSS ---
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Adaugă o tranzacție nouă ---
function addTransaction() {
  const amountInput   = document.getElementById('input-amount');
  const categoryInput = document.getElementById('input-category');
  const dateInput     = document.getElementById('input-date');
  const errorMsg      = document.getElementById('error-msg');

  const amount   = parseFloat(amountInput.value);
  const category = categoryInput.value.trim();
  const date     = dateInput.value;

  // Validare sumă
  if (!amountInput.value || isNaN(amount) || amount <= 0) {
    errorMsg.textContent = '⚠ Introdu o sumă validă, mai mare decât 0.';
    amountInput.focus();
    return;
  }

  // Validare dată
  if (!date) {
    errorMsg.textContent = '⚠ Selectează o dată.';
    dateInput.focus();
    return;
  }

  // Șterge eroarea dacă totul e ok
  errorMsg.textContent = '';

  // Construiește obiectul tranzacție
  const transactions = loadTransactions();
  const newTransaction = {
    id:       Date.now(),
    type:     currentType,
    amount:   Math.round(amount * 100) / 100, // evită floating point issues
    category: category,
    date:     date,
  };

  // Adaugă și salvează
  transactions.push(newTransaction);
  saveTransactions(transactions);

  // Actualizează UI
  updateDashboard(transactions);
  renderList(transactions);

  // Golește formularul (păstrează tipul și data curentă)
  amountInput.value = '';
  amountInput.focus();
}

// --- Șterge o tranzacție după id ---
function deleteTransaction(id) {
  let transactions = loadTransactions();
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(transactions);

  // Animație de ieșire
  const el = document.getElementById(`tx-${id}`);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(8px)';
    setTimeout(() => {
      updateDashboard(transactions);
      renderList(transactions);
    }, 200);
  } else {
    updateDashboard(transactions);
    renderList(transactions);
  }
}

// --- Initializare la încărcarea paginii ---
function init() {
  // Setează data implicită la ziua curentă
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;

  // Populează categoriile inițiale (income)
  populateCategories('income');

  // Permite submit cu tasta Enter pe câmpul de sumă
  document.getElementById('input-amount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTransaction();
  });

  // Încarcă datele existente și randează
  const transactions = loadTransactions();
  updateDashboard(transactions);
  renderList(transactions);
}

// Pornește aplicația
init();
