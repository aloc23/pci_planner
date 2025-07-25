import { initFilesTab } from './filesTab.js';

// Utility function
function getNumberInputValue(id) {
  const el = document.getElementById(id);
  const val = el ? Number(el.value) : NaN;
  return isNaN(val) ? 0 : val;
}

// Tab navigation and triggers
window.showTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== tabId);
  });
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  if (tabId === 'files') initFilesTab();
  if (tabId === 'padel') calculatePadel();
  if (tabId === 'gym') calculateGym();
  if (tabId === 'pnl') updatePnL();
  if (tabId === 'roi') { updateROI(); drawTornadoChart(); }
  if (tabId === 'summary') generateSummaryReport();
  if (tabId === 'gantt') { renderGanttTaskList(); drawGantt(); }
  if (tabId === 'scenarios') { renderScenarioList(); renderScenarioDiff(); }
};

// --- Padel calculation ---
window.calculatePadel = function() {
  const courts = getNumberInputValue('padelCourts');
  const courtCost = getNumberInputValue('padelCourtCost');
  const groundCost = getNumberInputValue('padelGround');
  const structureCost = getNumberInputValue('padelStructure');
  const amenities = getNumberInputValue('padelAmenities');
  const peakHours = getNumberInputValue('padelPeakHours');
  const peakUtil = getNumberInputValue('padelPeakUtil') / 100;
  const peakRate = getNumberInputValue('padelPeakRate');
  const offHours = getNumberInputValue('padelOffHours');
  const offUtil = getNumberInputValue('padelOffUtil') / 100;
  const offRate = getNumberInputValue('padelOffRate');
  const days = getNumberInputValue('padelDays');
  const weeks = getNumberInputValue('padelWeeks');
  const peakAnnualRevenue = peakHours * peakRate * days * weeks * courts * peakUtil;
  const offAnnualRevenue = offHours * offRate * days * weeks * courts * offUtil;
  const totalRevenue = peakAnnualRevenue + offAnnualRevenue;
  const opCosts = ['padelUtil','padelInsure','padelMaint','padelMarket','padelAdmin','padelClean','padelMisc'].map(getNumberInputValue).reduce((a,b)=>a+b,0);
  const staffCosts =
    getNumberInputValue('padelFtMgr') * getNumberInputValue('padelFtMgrSal') +
    getNumberInputValue('padelFtRec') * getNumberInputValue('padelFtRecSal') +
    getNumberInputValue('padelFtCoach') * getNumberInputValue('padelFtCoachSal') +
    getNumberInputValue('padelPtCoach') * getNumberInputValue('padelPtCoachSal') +
    getNumberInputValue('padelAddStaff') * getNumberInputValue('padelAddStaffSal');
  const netProfit = totalRevenue - opCosts - staffCosts;
  window.padelData = {
    revenue: totalRevenue,
    costs: opCosts + staffCosts,
    profit: netProfit,
    monthlyRevenue: totalRevenue / 12,
    monthlyCosts: (opCosts + staffCosts) / 12,
    monthlyProfit: netProfit / 12,
    investment: groundCost + structureCost + (courts * courtCost) + amenities
  };
  document.getElementById('padelSummary').innerHTML =
    `<b>Total Revenue:</b> €${totalRevenue.toLocaleString()}<br>
     <b>Operational Costs:</b> €${opCosts.toLocaleString()}<br>
     <b>Staff Costs:</b> €${staffCosts.toLocaleString()}<br>
     <b>Net Profit:</b> €${netProfit.toLocaleString()}<br>
     <b>Total Investment:</b> €${window.padelData.investment.toLocaleString()}`;
  updatePnL();
  updateROI();
};

// --- Gym calculation ---
window.calculateGym = function() {
  const equip = getNumberInputValue('gymEquip');
  const floor = getNumberInputValue('gymFloor');
  const amen = getNumberInputValue('gymAmen');
  const weekMembers = getNumberInputValue('gymWeekMembers');
  const weekFee = getNumberInputValue('gymWeekFee');
  const monthMembers = getNumberInputValue('gymMonthMembers');
  const monthFee = getNumberInputValue('gymMonthFee');
  const annualMembers = getNumberInputValue('gymAnnualMembers');
  const annualFee = getNumberInputValue('gymAnnualFee');
  const totalAnnualRevenue = weekMembers * weekFee * 52 + monthMembers * monthFee * 12 + annualMembers * annualFee;
  const opCosts = ['gymUtil','gymInsure','gymMaint','gymMarket','gymAdmin','gymClean','gymMisc'].map(getNumberInputValue).reduce((a,b)=>a+b,0);
  const staffCosts =
    getNumberInputValue('gymFtTrainer') * getNumberInputValue('gymFtTrainerSal') +
    getNumberInputValue('gymPtTrainer') * getNumberInputValue('gymPtTrainerSal') +
    getNumberInputValue('gymAddStaff') * getNumberInputValue('gymAddStaffSal');
  let adjustedAnnualRevenue = totalAnnualRevenue;
  if (document.getElementById('gymRamp').checked) {
    const rampDuration = getNumberInputValue('rampDuration');
    const rampEffect = getNumberInputValue('rampEffect') / 100;
    let totalRev = 0;
    for (let i = 1; i <= 12; i++) {
      if (i <= rampDuration) { totalRev += totalAnnualRevenue * rampEffect; }
      else { totalRev += totalAnnualRevenue; }
    }
    adjustedAnnualRevenue = totalRev;
  }
  const netProfit = adjustedAnnualRevenue - opCosts - staffCosts;
  window.gymData = {
    revenue: adjustedAnnualRevenue,
    costs: opCosts + staffCosts,
    profit: netProfit,
    monthlyRevenue: adjustedAnnualRevenue / 12,
    monthlyCosts: (opCosts + staffCosts) / 12,
    monthlyProfit: netProfit / 12,
    investment: equip + floor + amen
  };
  document.getElementById('gymSummary').innerHTML =
    `<b>Annual Revenue:</b> €${adjustedAnnualRevenue.toLocaleString()}<br>
     <b>Operational Costs:</b> €${opCosts.toLocaleString()}<br>
     <b>Staff Costs:</b> €${staffCosts.toLocaleString()}<br>
     <b>Net Profit:</b> €${netProfit.toLocaleString()}<br>
     <b>Total Investment:</b> €${window.gymData.investment.toLocaleString()}`;
  updatePnL();
  updateROI();
};

// --- PnL Tab and Charts ---
let pnlChart, profitTrendChart, costPieChart;
function updatePnL() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };
  const gym = document.getElementById('includeGym').checked && window.gymData ? window.gymData : { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };
  const totalRevenue = padel.revenue + gym.revenue;
  const totalCosts = padel.costs + gym.costs;
  const totalProfit = padel.profit + gym.profit;
  document.getElementById('pnlSummary').innerHTML =
    `<b>Total Revenue:</b> €${Math.round(totalRevenue).toLocaleString()}<br>
     <b>Total Costs:</b> €${Math.round(totalCosts).toLocaleString()}<br>
     <b>Net Profit:</b> €${Math.round(totalProfit).toLocaleString()}`;
  // Monthly breakdown
  const tbody = document.querySelector('#monthlyBreakdown tbody');
  tbody.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const rev = padel.monthlyRevenue + gym.monthlyRevenue;
    const costs = padel.monthlyCosts + gym.monthlyCosts;
    const profit = padel.monthlyProfit + gym.monthlyProfit;
    tbody.insertAdjacentHTML('beforeend', `<tr><td>${i}</td><td>€${rev.toFixed(2)}</td><td>€${costs.toFixed(2)}</td><td>€${profit.toFixed(2)}</td></tr>`);
  }
  // Cash flow
  const cashFlowBody = document.querySelector('#cashFlowTable tbody');
  let opening = 0;
  cashFlowBody.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const inflow = padel.monthlyRevenue + gym.monthlyRevenue;
    const outflow = padel.monthlyCosts + gym.monthlyCosts;
    const closing = opening + inflow - outflow;
    cashFlowBody.insertAdjacentHTML('beforeend',
      `<tr><td>${i}</td><td>€${opening.toFixed(2)}</td><td>€${inflow.toFixed(2)}</td><td>€${outflow.toFixed(2)}</td><td>€${closing.toFixed(2)}</td></tr>`);
    opening = closing;
  }
  // Charts
  if (pnlChart) pnlChart.destroy();
  if (profitTrendChart) profitTrendChart.destroy();
  if (costPieChart) costPieChart.destroy();
  pnlChart = new Chart(document.getElementById('pnlChart').getContext('2d'), {
    type: 'bar',
    data: { labels: ['Revenue', 'Costs', 'Profit'], datasets: [{ label: 'Annual', data: [totalRevenue, totalCosts, totalProfit], backgroundColor: ['#4caf50', '#f44336', '#2196f3'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  profitTrendChart = new Chart(document.getElementById('profitTrendChart').getContext('2d'), {
    type: 'line',
    data: { labels: [...Array(12).keys()].map(m => `Month ${m + 1}`), datasets: [{ label: 'Profit', data: new Array(12).fill(totalProfit / 12), fill: true, backgroundColor: 'rgba(33,150,243,0.2)', borderColor: 'rgba(33,150,243,1)', borderWidth: 2, tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  costPieChart = new Chart(document.getElementById('costPieChart').getContext('2d'), {
    type: 'pie',
    data: { labels: ['Padel Costs', 'Gym Costs'], datasets: [{ data: [padel.costs, gym.costs], backgroundColor: ['#f39c12', '#3498db'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// --- ROI Tab and Charts ---
let roiLineChart, roiBarChart, roiPieChart, roiBreakEvenChart, tornadoChart;
function updateROI() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0, investment: 0 };
  const gym = document.getElementById('includeGymROI').checked && window.gymData ? window.gymData : { revenue: 0, costs: 0, profit: 0, investment: 0 };
  const revAdjust = getNumberInputValue('roiRevAdjust') / 100 || 1;
  const costAdjust = getNumberInputValue('roiCostAdjust') / 100 || 1;
  const padelAdjProfit = (padel.revenue * revAdjust) - (padel.costs * costAdjust);
  const gymAdjProfit = (gym.revenue * revAdjust) - (gym.costs * costAdjust);
  const totalInvestment = padel.investment + gym.investment;
  const annualProfit = padelAdjProfit + gymAdjProfit;
  const paybackYears = annualProfit > 0 ? Math.ceil(totalInvestment / annualProfit) : '∞';
  document.getElementById('yearsToROIText').innerHTML = `<div class="roi-summary">Estimated Payback Period: <b>${paybackYears} year(s)</b></div>`;
  let cumulativeProfit = 0;
  const years = [...Array(10).keys()].map(i => i + 1);
  const cumulativeProfits = years.map(year => cumulativeProfit += annualProfit);
  const paybackBody = document.querySelector('#paybackTable tbody');
  paybackBody.innerHTML = '';
  cumulativeProfits.forEach((val, idx) => {
    paybackBody.insertAdjacentHTML('beforeend', `<tr><td>${years[idx]}</td><td>€${val.toFixed(2)}</td></tr>`);
  });
  if (roiLineChart) roiLineChart.destroy();
  if (roiBarChart) roiBarChart.destroy();
  if (roiPieChart) roiPieChart.destroy();
  if (roiBreakEvenChart) roiBreakEvenChart.destroy();
  roiLineChart = new Chart(document.getElementById('roiLineChart').getContext('2d'), {
    type: 'line',
    data: { labels: years.map(y => `Year ${y}`), datasets: [{ label: 'Cumulative Profit (€)', data: cumulativeProfits, borderColor: '#27ae60', fill: false, tension: 0.2 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  roiBarChart = new Chart(document.getElementById('roiBarChart').getContext('2d'), {
    type: 'bar',
    data: { labels: ['Padel', 'Gym'], datasets: [{ label: 'Annual Profit (€)', data: [padelAdjProfit, gymAdjProfit], backgroundColor: ['#e67e22', '#2980b9'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  roiPieChart = new Chart(document.getElementById('roiPieChart').getContext('2d'), {
    type: 'pie',
    data: { labels: ['Padel Investment', 'Gym Investment'], datasets: [{ data: [padel.investment, gym.investment], backgroundColor: ['#c0392b', '#2980b9'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  roiBreakEvenChart = new Chart(document.getElementById('roiBreakEvenChart').getContext('2d'), {
    type: 'line',
    data: { labels: years.map(y => `Year ${y}`), datasets: [
      { label: 'Cumulative Profit', data: cumulativeProfits, borderColor: '#27ae60', fill: false, tension: 0.2, pointRadius: 3 },
      { label: 'Total Investment', data: new Array(years.length).fill(totalInvestment), borderColor: '#c0392b', borderDash: [10,5], fill: false, pointRadius: 0, tension: 0 }
    ] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  const roiKPIs = document.getElementById('roiKPIs');
  roiKPIs.innerHTML = '<h3>ROI Percentages</h3><ul>' +
    [1,3,5].map(year => {
      const roi = annualProfit * year / totalInvestment * 100;
      return `<li>Year ${year}: ${isFinite(roi) ? roi.toFixed(1) + '%' : 'N/A'}</li>`;
    }).join('') + '</ul>';
}

// --- Tornado Chart ---
function drawTornadoChart() {
  const keyVars = [
    { label: 'Padel Utilization', id: 'padelPeakUtil' },
    { label: 'Padel Fee', id: 'padelPeakRate' },
    { label: 'Padel Staff Salary', id: 'padelFtMgrSal' },
    { label: 'Gym Utilization', id: 'gymWeekMembers' },
    { label: 'Gym Fee', id: 'gymWeekFee' },
    { label: 'Gym Staff Salary', id: 'gymFtTrainerSal' }
  ];
  const impacts = keyVars.map(v => {
    const orig = getNumberInputValue(v.id);
    let minVal = Math.max(0, orig * 0.8), maxVal = orig * 1.2;
    document.getElementById(v.id).value = minVal;
    calculatePadel(); calculateGym();
    const low = (window.padelData?.profit || 0) + (window.gymData?.profit || 0);
    document.getElementById(v.id).value = maxVal;
    calculatePadel(); calculateGym();
    const high = (window.padelData?.profit || 0) + (window.gymData?.profit || 0);
    document.getElementById(v.id).value = orig;
    calculatePadel(); calculateGym();
    return Math.abs(high - low);
  });
  if (tornadoChart) tornadoChart.destroy();
  tornadoChart = new Chart(document.getElementById('tornadoChart').getContext('2d'), {
    type: 'bar',
    data: { labels: keyVars.map(v => v.label), datasets: [{ label: 'Impact on Net Profit (€)', data: impacts, backgroundColor: '#f39c12' }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });
}

// --- Scenario Management ---
function getScenarioState() {
  const ids = [
    'padelCourts','padelCourtCost','padelGround','padelStructure','padelAmenities','padelPeakHours','padelPeakUtil','padelPeakRate','padelOffHours','padelOffUtil','padelOffRate','padelDays','padelWeeks',
    'padelUtil','padelInsure','padelMaint','padelMarket','padelAdmin','padelClean','padelMisc',
    'padelFtMgr','padelFtMgrSal','padelFtRec','padelFtRecSal','padelFtCoach','padelFtCoachSal','padelPtCoach','padelPtCoachSal','padelAddStaff','padelAddStaffSal',
    'gymEquip','gymFloor','gymAmen','gymWeekMembers','gymWeekFee','gymMonthMembers','gymMonthFee','gymAnnualMembers','gymAnnualFee',
    'gymUtil','gymInsure','gymMaint','gymMarket','gymAdmin','gymClean','gymMisc',
    'gymFtTrainer','gymFtTrainerSal','gymPtTrainer','gymPtTrainerSal','gymAddStaff','gymAddStaffSal',
    'gymRamp','rampDuration','rampEffect',
    'roiRevAdjust','roiCostAdjust'
  ];
  const state = {};
  ids.forEach(id => state[id] = getNumberInputValue(id) || (document.getElementById(id) && document.getElementById(id).type === "checkbox" ? document.getElementById(id).checked : 0));
  state['scenarioTimestamp'] = Date.now();
  return state;
}
function setScenarioState(state) {
  Object.keys(state).forEach(id => {
    if (document.getElementById(id)) {
      if (document.getElementById(id).type === "checkbox") document.getElementById(id).checked = state[id];
      else document.getElementById(id).value = state[id];
    }
  });
  calculatePadel();
  calculateGym();
  updateROI();
}
function saveScenario(name) {
  const scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
  const state = getScenarioState();
  state['name'] = name;
  scenarios.push(state);
  localStorage.setItem('scenarios', JSON.stringify(scenarios));
}
function renderScenarioList() {
  const scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
  const listDiv = document.getElementById('scenarioList');
  listDiv.innerHTML = scenarios.map((s, i) =>
    `<div>
      <b>${s.name}</b>
      <button onclick="loadScenario(${i})">Load</button>
      <button onclick="deleteScenario(${i})">Delete</button>
      <input type="checkbox" id="diff${i}" onchange="renderScenarioDiff()" /> Compare
    </div>`
  ).join('');
}
window.loadScenario = function(i) {
  const scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
  setScenarioState(scenarios[i]);
};
window.deleteScenario = function(i) {
  let scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
  scenarios.splice(i, 1);
  localStorage.setItem('scenarios', JSON.stringify(scenarios));
  renderScenarioList();
  renderScenarioDiff();
};
function renderScenarioDiff() {
  const scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
  const indices = [];
  scenarios.forEach((s, i) => { if (document.getElementById('diff'+i)?.checked) indices.push(i); });
  const container = document.getElementById('scenarioDiffContainer');
  if (indices.length < 2) { container.innerHTML = ""; return; }
  const a = scenarios[indices[0]], b = scenarios[indices[1]];
  let diffHtml = `<table class="breakdown-table"><tr><th>Variable</th><th>${a.name}</th><th>${b.name}</th></tr>`;
  Object.keys(a).forEach(k => {
    if (typeof a[k] === "number" && a[k] !== b[k]) {
      diffHtml += `<tr><td>${k}</td><td style="background:#fffae6">${a[k]}</td><td style="background:#e6fff3">${b[k]}</td></tr>`;
    }
  });
  diffHtml += "</table>";
  container.innerHTML = diffHtml;
}
document.getElementById('scenarioForm').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('scenarioName').value.trim();
  if (name) {
    saveScenario(name);
    renderScenarioList();
    document.getElementById('scenarioName').value = '';
  }
};

// --- Summary Tab & Export ---
function generateSummaryReport() {
  const padel = window.padelData || {};
  const gym = window.gymData || {};
  document.getElementById('reportContent').innerHTML = `
    <h3>Key Financials</h3>
    <ul>
      <li><b>Padel Revenue:</b> €${(padel.revenue||0).toLocaleString()}</li>
      <li><b>Padel Net Profit:</b> €${(padel.profit||0).toLocaleString()}</li>
      <li><b>Gym Revenue:</b> €${(gym.revenue||0).toLocaleString()}</li>
      <li><b>Gym Net Profit:</b> €${(gym.profit||0).toLocaleString()}</li>
      <li><b>Total Investment:</b> €${((padel.investment||0)+(gym.investment||0)).toLocaleString()}</li>
    </ul>
    <div><canvas id="summaryPnL" height="150"></canvas></div>
    <div><canvas id="summaryROI" height="150"></canvas></div>
  `;
  if (window.summaryPnLChart) window.summaryPnLChart.destroy();
  if (window.summaryROIChart) window.summaryROIChart.destroy();
  window.summaryPnLChart = new Chart(document.getElementById('summaryPnL').getContext('2d'), {
    type: 'bar',
    data: { labels: ['Padel Profit', 'Gym Profit'], datasets: [{label: 'Net Profit', data: [padel.profit||0, gym.profit||0], backgroundColor: ['#4caf50','#2980b9']}] },
    options: { responsive:true, maintainAspectRatio:false }
  });
  window.summaryROIChart = new Chart(document.getElementById('summaryROI').getContext('2d'), {
    type: 'pie',
    data: { labels: ['Padel Investment','Gym Investment'], datasets: [{data: [padel.investment||0, gym.investment||0], backgroundColor: ['#f39c12','#3498db']}] },
    options: { responsive:true, maintainAspectRatio:false }
  });
}
document.getElementById('exportPDFBtn').addEventListener('click', function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.html(document.getElementById('reportContent'), {
    callback: function (pdf) { pdf.save("Investment_Summary.pdf"); },
    x: 10, y: 10
  });
});
document.getElementById('exportExcelBtn').addEventListener('click', function() {
  const wb = XLSX.utils.book_new();
  const table = document.getElementById('monthlyBreakdown');
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "Monthly Breakdown");
  XLSX.writeFile(wb, "Investment_Breakdown.xlsx");
});

// --- Gantt Tab ---
let ganttTasks = [];
function loadGanttTasks() {
  const saved = localStorage.getItem('userGanttTasks');
  ganttTasks = saved ? JSON.parse(saved) : [
    { id:'1',name:'Feasibility Study & Business Plan',start:'2025-01-01',end:'2025-01-21',progress:100 },
    { id:'2',name:'Site Selection & Acquisition',start:'2025-01-22',end:'2025-02-15',progress:100 },
    { id:'3',name:'Planning & Permits',start:'2025-02-16',end:'2025-03-10',progress:80 },
    { id:'4',name:'Design & Engineering',start:'2025-02-20',end:'2025-03-25',progress:60 }
  ];
}
function saveGanttTasks() {
  localStorage.setItem('userGanttTasks', JSON.stringify(ganttTasks));
}
function renderGanttTaskList() {
  const div = document.getElementById('ganttTaskList');
  if (!ganttTasks.length) { div.innerHTML = '<em>No tasks. Add one above!</em>'; return; }
  let html = '<table><tr><th>Name</th><th>Start</th><th>End</th><th>Progress</th><th></th></tr>';
  ganttTasks.forEach(task => {
    html += `<tr>
      <td>${task.name}</td>
      <td>${task.start}</td>
      <td>${task.end}</td>
      <td>${task.progress}%</td>
      <td>
        <button type="button" onclick="editGanttTask('${task.id}')">Edit</button>
        <button type="button" onclick="deleteGanttTask('${task.id}')">Delete</button>
      </td>
    </tr>`;
  });
  html += '</table>';
  div.innerHTML = html;
}
window.editGanttTask = function(id) {
  const t = ganttTasks.find(t => t.id === id);
  if (t) {
    document.getElementById('ganttEditId').value = t.id;
    document.getElementById('ganttTaskName').value = t.name;
    document.getElementById('ganttTaskStart').value = t.start;
    document.getElementById('ganttTaskEnd').value = t.end;
    document.getElementById('ganttTaskProgress').value = t.progress;
  }
};
window.deleteGanttTask = function(id) {
  ganttTasks = ganttTasks.filter(t => t.id !== id);
  saveGanttTasks();
  renderGanttTaskList();
  drawGantt();
};
document.getElementById('ganttTaskForm').onsubmit = function(e) {
  e.preventDefault();
  const id = document.getElementById('ganttEditId').value || Date.now().toString();
  const name = document.getElementById('ganttTaskName').value;
  const start = document.getElementById('ganttTaskStart').value;
  const end = document.getElementById('ganttTaskEnd').value;
  const progress = Number(document.getElementById('ganttTaskProgress').value);
  const idx = ganttTasks.findIndex(t => t.id === id);
  if (idx >= 0) ganttTasks[idx] = { id, name, start, end, progress };
  else ganttTasks.push({ id, name, start, end, progress });
  saveGanttTasks();
  renderGanttTaskList();
  drawGantt();
  this.reset();
};
document.getElementById('ganttTaskResetBtn').addEventListener('click', function() {
  document.getElementById('ganttEditId').value = '';
  document.getElementById('ganttTaskForm').reset();
});
function drawGantt() {
  loadGanttTasks();
  const ganttContainer = document.getElementById('ganttContainer');
  ganttContainer.innerHTML = "";
  const ganttDiv = document.createElement('div');
  ganttDiv.id = "ganttChartDiv";
  ganttContainer.appendChild(ganttDiv);
  if (ganttTasks.length > 0) new Gantt("#ganttChartDiv", ganttTasks, { view_mode: 'Month' });
}

// --- Initialization ---
window.onload = function () {
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', function () {
      window.showTab(this.dataset.tab);
    });
  });
  document.getElementById('calculatePadelBtn').addEventListener('click', window.calculatePadel);
  document.getElementById('calculateGymBtn').addEventListener('click', window.calculateGym);
  document.getElementById('includeGym').addEventListener('change', updatePnL);
  document.getElementById('includeGymROI').addEventListener('change', updateROI);
  window.showTab('padel');
  window.calculatePadel();
  window.calculateGym();
  renderScenarioList();
  renderScenarioDiff();
};
