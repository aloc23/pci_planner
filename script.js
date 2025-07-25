// --- Utility Functions & Variable Declarations ---
function getNumberInputValue(id) {
  const el = document.getElementById(id);
  const val = el ? Number(el.value) : NaN;
  return isNaN(val) ? 0 : val;
}
function validateInputs(inputIds) {
  const errors = [];
  inputIds.forEach((id) => {
    const val = getNumberInputValue(id);
    if (val < 0) errors.push(`Value for ${id} cannot be negative`);
    if (isNaN(val)) errors.push(`Value for ${id} is not a number`);
  });
  return errors;
}
const padelInputIds = [
  'padelGround', 'padelStructure', 'padelCourts', 'padelCourtCost', 'padelAmenities',
  'padelPeakHours', 'padelPeakRate', 'padelPeakUtil', 'padelOffHours', 'padelOffRate', 'padelOffUtil',
  'padelDays', 'padelWeeks', 'padelUtil', 'padelInsure', 'padelMaint', 'padelMarket', 'padelAdmin',
  'padelClean', 'padelMisc', 'padelFtMgr', 'padelFtMgrSal', 'padelFtRec', 'padelFtRecSal', 'padelFtCoach',
  'padelFtCoachSal', 'padelPtCoach', 'padelPtCoachSal', 'padelAddStaff', 'padelAddStaffSal'
];
const gymInputIds = [
  'gymEquip', 'gymFloor', 'gymAmen', 'gymWeekMembers', 'gymWeekFee',
  'gymMonthMembers', 'gymMonthFee', 'gymAnnualMembers', 'gymAnnualFee', 'gymUtil', 'gymInsure',
  'gymMaint', 'gymMarket', 'gymAdmin', 'gymClean', 'gymMisc',
  'gymFtTrainer', 'gymFtTrainerSal', 'gymPtTrainer', 'gymPtTrainerSal', 'gymAddStaff', 'gymAddStaffSal'
];
function calculateOperationCosts(prefix) {
  return (
    getNumberInputValue(`${prefix}Util`) +
    getNumberInputValue(`${prefix}Insure`) +
    getNumberInputValue(`${prefix}Maint`) +
    getNumberInputValue(`${prefix}Market`) +
    getNumberInputValue(`${prefix}Admin`) +
    getNumberInputValue(`${prefix}Clean`) +
    getNumberInputValue(`${prefix}Misc`)
  );
}
function calculateStaffCosts(ids) {
  return ids.reduce((sum, [countId, salaryId]) => {
    return sum + getNumberInputValue(countId) * getNumberInputValue(salaryId);
  }, 0);
}
let pnlChart, profitTrendChart, costPieChart, roiLineChart, roiBarChart, roiPieChart, roiBreakEvenChart, tornadoChart;
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// --- Tab Navigation & Scroll ---
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== tabId);
  });
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
  if (tabId === 'pnl') updatePnL();
  if (tabId === 'roi') { updateROI(); drawTornadoChart(); }
  if (tabId === 'summary') generateSummaryReport();
  if (tabId === 'gantt') { renderGanttTaskList(); drawGantt(); }
  if (tabId === 'scenarios') { renderScenarioList(); renderScenarioDiff(); }
}
window.showTab = showTab;

// --- Padel Calculation ---
window.calculatePadel = function() {
  const errors = validateInputs(padelInputIds);
  if (errors.length) { alert(errors.join('\n')); return; }
  const peakHours = getNumberInputValue('padelPeakHours');
  const peakDays = getNumberInputValue('padelDays');
  const peakWeeks = getNumberInputValue('padelWeeks');
  const peakUtil = getNumberInputValue('padelPeakUtil') / 100;
  const offHours = getNumberInputValue('padelOffHours');
  const offUtil = getNumberInputValue('padelOffUtil') / 100;
  const courts = getNumberInputValue('padelCourts');
  const peakAnnualRevenue = peakHours * getNumberInputValue('padelPeakRate') * peakDays * peakWeeks * courts * peakUtil;
  const offAnnualRevenue = offHours * getNumberInputValue('padelOffRate') * peakDays * peakWeeks * courts * offUtil;
  const totalRevenue = peakAnnualRevenue + offAnnualRevenue;
  const totalOpCosts = calculateOperationCosts('padel');
  const totalStaffCost = calculateStaffCosts([
    ['padelFtMgr', 'padelFtMgrSal'],
    ['padelFtRec', 'padelFtRecSal'],
    ['padelFtCoach', 'padelFtCoachSal'],
    ['padelPtCoach', 'padelPtCoachSal'],
    ['padelAddStaff', 'padelAddStaffSal'],
  ]);
  const netProfit = totalRevenue - totalOpCosts - totalStaffCost;
  const peakAvailable = peakHours * peakDays * peakWeeks;
  const peakUtilized = peakAvailable * peakUtil;
  const offAvailable = offHours * peakDays * peakWeeks;
  const offUtilized = offAvailable * offUtil;
  const utilBreakdown = `
  <h4>Utilization Breakdown (per court)</h4>
  <ul>
    <li>Peak: ${peakHours}h/day × ${peakDays}d/week × ${peakWeeks}w/year = <b>${peakAvailable}</b> hours available</li>
    <li>Peak Utilized: <b>${peakUtilized.toFixed(1)}</b> hours/year (${(peakUtil*100).toFixed(1)}% utilization)</li>
    <li>Off-Peak: ${offHours}h/day × ${peakDays}d/week × ${peakWeeks}w/year = <b>${offAvailable}</b> hours available</li>
    <li>Off-Peak Utilized: <b>${offUtilized.toFixed(1)}</b> hours/year (${(offUtil*100).toFixed(1)}% utilization)</li>
    <li>Total Utilized (all courts): <b>${((peakUtilized + offUtilized) * courts).toFixed(1)}</b> hours/year</li>
  </ul>
  `;
  window.padelData = {
    revenue: totalRevenue,
    costs: totalOpCosts + totalStaffCost,
    profit: netProfit,
    monthlyRevenue: totalRevenue / 12,
    monthlyCosts: (totalOpCosts + totalStaffCost) / 12,
    monthlyProfit: netProfit / 12,
  };
  document.getElementById('padelSummary').innerHTML = `
    <h3>Summary</h3>
    <p><b>Total Revenue:</b> €${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Operational Costs:</b> €${totalOpCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Staff Costs:</b> €${totalStaffCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Net Profit:</b> €${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    ${utilBreakdown}
  `;
  updatePnL();
  updateROI();
};

// --- Gym Calculation ---
window.calculateGym = function() {
  const errors = validateInputs(gymInputIds);
  if (errors.length) { alert(errors.join('\n')); return; }
  const weeklyRevenueAnnual = getNumberInputValue('gymWeekMembers') * getNumberInputValue('gymWeekFee') * 52;
  const monthlyRevenueAnnual = getNumberInputValue('gymMonthMembers') * getNumberInputValue('gymMonthFee') * 12;
  const annualRevenueAnnual = getNumberInputValue('gymAnnualMembers') * getNumberInputValue('gymAnnualFee');
  const totalAnnualRevenue = weeklyRevenueAnnual + monthlyRevenueAnnual + annualRevenueAnnual;
  const totalOpCosts = calculateOperationCosts('gym');
  const totalStaffCost = calculateStaffCosts([
    ['gymFtTrainer', 'gymFtTrainerSal'],
    ['gymPtTrainer', 'gymPtTrainerSal'],
    ['gymAddStaff', 'gymAddStaffSal'],
  ]);
  let adjustedAnnualRevenue = totalAnnualRevenue;
  let rampSummary = "";
  if (document.getElementById('gymRamp').checked) {
    const rampDuration = getNumberInputValue('rampDuration');
    const rampEffect = getNumberInputValue('rampEffect') / 100;
    const monthlyRevenue = totalAnnualRevenue / 12;
    let totalRev = 0;
    for (let i = 1; i <= 12; i++) {
      if (i <= rampDuration) {
        totalRev += monthlyRevenue * rampEffect;
      } else {
        totalRev += monthlyRevenue;
      }
    }
    adjustedAnnualRevenue = totalRev;
    rampSummary = `<p><b>Ramp-up:</b> First ${rampDuration} months at ${getNumberInputValue('rampEffect')}% revenue</p>`;
  }
  const netProfit = adjustedAnnualRevenue - totalOpCosts - totalStaffCost;
  window.gymData = {
    revenue: adjustedAnnualRevenue,
    costs: totalOpCosts + totalStaffCost,
    profit: netProfit,
    monthlyRevenue: adjustedAnnualRevenue / 12,
    monthlyCosts: (totalOpCosts + totalStaffCost) / 12,
    monthlyProfit: netProfit / 12,
  };
  document.getElementById('gymSummary').innerHTML = `
    <h3>Summary</h3>
    <p><b>Annual Revenue:</b> €${adjustedAnnualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Operational Costs:</b> €${totalOpCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Staff Costs:</b> €${totalStaffCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    <p><b>Net Profit:</b> €${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    ${rampSummary}
  `;
  updatePnL();
  updateROI();
};
function gymIncluded() {
  return document.getElementById('includeGym')?.checked ?? true;
}
function gymIncludedROI() {
  return document.getElementById('includeGymROI')?.checked ?? true;
}

// --- PnL Calculation and Charts ---
function updatePnL() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };
  const gym = gymIncluded() && window.gymData ? window.gymData : { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };
  const totalRevenue = padel.revenue + gym.revenue;
  const totalCosts = padel.costs + gym.costs;
  const totalProfit = padel.profit + gym.profit;
  const summaryDiv = document.getElementById('pnlSummary');
  summaryDiv.innerHTML = `
    <p><b>Total Revenue:</b> €${Math.round(totalRevenue).toLocaleString('en-US')}</p>
    <p><b>Total Costs:</b> €${Math.round(totalCosts).toLocaleString('en-US')}</p>
    <p><b>Net Profit:</b> €${Math.round(totalProfit).toLocaleString('en-US')}</p>
  `;
  // Monthly breakdown
  const tbody = document.querySelector('#monthlyBreakdown tbody');
  tbody.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const rev = (padel.monthlyRevenue + gym.monthlyRevenue);
    const costs = (padel.monthlyCosts + gym.monthlyCosts);
    const profit = (padel.monthlyProfit + gym.monthlyProfit);
    const row = `<tr><td>${i}</td><td>€${rev.toFixed(2)}</td><td>€${costs.toFixed(2)}</td><td>€${profit.toFixed(2)}</td></tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  }
  // Cash flow calculation
  const cashFlowBody = document.querySelector('#cashFlowTable tbody');
  let opening = 0;
  cashFlowBody.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const inflow = (padel.monthlyRevenue + gym.monthlyRevenue);
    const outflow = (padel.monthlyCosts + gym.monthlyCosts);
    const closing = opening + inflow - outflow;
    cashFlowBody.insertAdjacentHTML('beforeend',
      `<tr><td>${i}</td><td>€${opening.toFixed(2)}</td><td>€${inflow.toFixed(2)}</td><td>€${outflow.toFixed(2)}</td><td>€${closing.toFixed(2)}</td></tr>`);
    opening = closing;
  }
  // Charts
  if (pnlChart) pnlChart.destroy();
  if (profitTrendChart) profitTrendChart.destroy();
  if (costPieChart) costPieChart.destroy();
  // PnL Chart
  const ctxPnl = document.getElementById('pnlChart').getContext('2d');
  pnlChart = new Chart(ctxPnl, {
    type: 'bar',
    data: {
      labels: ['Revenue', 'Costs', 'Profit'],
      datasets: [{
        label: 'Annual Amount (€)',
        data: [totalRevenue, totalCosts, totalProfit],
        backgroundColor: ['#4caf50', '#f44336', '#2196f3']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Profit Trend Chart
  const ctxProfitTrend = document.getElementById('profitTrendChart').getContext('2d');
  const monthlyProfits = new Array(12).fill(totalProfit / 12);
  profitTrendChart = new Chart(ctxProfitTrend, {
    type: 'line',
    data: {
      labels: [...Array(12).keys()].map(m => `Month ${m + 1}`),
      datasets: [{
        label: 'Profit',
        data: monthlyProfits,
        fill: true,
        backgroundColor: 'rgba(33,150,243,0.2)',
        borderColor: 'rgba(33,150,243,1)',
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Cost Pie Chart
  const ctxCostPie = document.getElementById('costPieChart').getContext('2d');
  costPieChart = new Chart(ctxCostPie, {
    type: 'pie',
    data: {
      labels: ['Padel Costs', 'Gym Costs'],
      datasets: [{
        data: [padel.costs, gym.costs],
        backgroundColor: ['#f39c12', '#3498db']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
function getTotalInvestment() {
  return (
    getNumberInputValue('padelGround') +
    getNumberInputValue('padelStructure') +
    (getNumberInputValue('padelCourts') * getNumberInputValue('padelCourtCost')) +
    getNumberInputValue('padelAmenities') +
    getNumberInputValue('gymEquip') +
    getNumberInputValue('gymFloor') +
    getNumberInputValue('gymAmen')
  );
}

// --- ROI calculations and charts ---
window.updateROIAdjustmentLabel = function(val) {
  document.getElementById('roiRevAdjustLabel').textContent = `${getNumberInputValue('roiRevAdjust')}%`;
  document.getElementById('roiCostAdjustLabel').textContent = `${getNumberInputValue('roiCostAdjust')}%`;
  updateROI();
};
window.updateRampDurationLabel = function(val) {
  document.getElementById('rampDurationLabel').textContent = val;
};
window.updateRampEffectLabel = function(val) {
  document.getElementById('rampEffectLabel').textContent = `${val}%`;
};
function updateROI() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0 };
  const gym = gymIncludedROI() && window.gymData ? window.gymData : { revenue: 0, costs: 0, profit: 0 };
  const revAdjust = getNumberInputValue('roiRevAdjust') / 100;
  const costAdjust = getNumberInputValue('roiCostAdjust') / 100;
  const padelAdjProfit = (padel.revenue * revAdjust) - (padel.costs * costAdjust);
  const gymAdjProfit = (gym.revenue * revAdjust) - (gym.costs * costAdjust);
  const padelInvestment =
    getNumberInputValue('padelGround') +
    getNumberInputValue('padelStructure') +
    (getNumberInputValue('padelCourts') * getNumberInputValue('padelCourtCost')) +
    getNumberInputValue('padelAmenities');
  const gymInvestment =
    getNumberInputValue('gymEquip') +
    getNumberInputValue('gymFloor') +
    getNumberInputValue('gymAmen');
  const totalInvestment = padelInvestment + (gymIncludedROI() ? gymInvestment : 0);
  const annualProfit = padelAdjProfit + (gymIncludedROI() ? gymAdjProfit : 0);
  const paybackYears = annualProfit > 0 ? Math.ceil(totalInvestment / annualProfit) : '∞';
  document.getElementById('yearsToROIText').innerHTML = `<div class="roi-summary">Estimated Payback Period: <b>${paybackYears} year(s)</b></div>`;
  let cumulativeProfit = 0;
  const years = [...Array(10).keys()].map(i => i + 1);
  const cumulativeProfits = years.map(year => {
    cumulativeProfit += annualProfit;
    return cumulativeProfit;
  });
  const paybackBody = document.querySelector('#paybackTable tbody');
  paybackBody.innerHTML = '';
  cumulativeProfits.forEach((val, idx) => {
    paybackBody.insertAdjacentHTML('beforeend', `<tr><td>${years[idx]}</td><td>€${val.toFixed(2)}</td></tr>`);
  });
  if (roiLineChart) roiLineChart.destroy();
  if (roiBarChart) roiBarChart.destroy();
  if (roiPieChart) roiPieChart.destroy();
  if (roiBreakEvenChart) roiBreakEvenChart.destroy();
  // Line Chart: Cumulative Profit Over Time
  const ctxRoiLine = document.getElementById('roiLineChart').getContext('2d');
  roiLineChart = new Chart(ctxRoiLine, {
    type: 'line',
    data: {
      labels: years.map(y => `Year ${y}`),
      datasets: [{
        label: 'Cumulative Profit (€)',
        data: cumulativeProfits,
        borderColor: '#27ae60',
        fill: false,
        tension: 0.2
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Bar Chart: Annual Profit Breakdown Padel vs Gym
  const ctxRoiBar = document.getElementById('roiBarChart').getContext('2d');
  roiBarChart = new Chart(ctxRoiBar, {
    type: 'bar',
    data: {
      labels: ['Padel', 'Gym'],
      datasets: [{
        label: 'Annual Profit (€)',
        data: [padelAdjProfit, gymIncludedROI() ? gymAdjProfit : 0],
        backgroundColor: ['#e67e22', '#2980b9']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Pie Chart: Investment Breakdown
  const ctxRoiPie = document.getElementById('roiPieChart').getContext('2d');
  roiPieChart = new Chart(ctxRoiPie, {
    type: 'pie',
    data: {
      labels: ['Padel Investment', 'Gym Investment'],
      datasets: [{
        data: [padelInvestment, gymIncludedROI() ? gymInvestment : 0],
        backgroundColor: ['#c0392b', '#2980b9']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Break-even Chart: Cumulative Profit vs Investment
  const ctxBreakEven = document.getElementById('roiBreakEvenChart').getContext('2d');
  roiBreakEvenChart = new Chart(ctxBreakEven, {
    type: 'line',
    data: {
      labels: years.map(y => `Year ${y}`),
      datasets: [
        {
          label: 'Cumulative Profit',
          data: cumulativeProfits,
          borderColor: '#27ae60',
          fill: false,
          tension: 0.2,
          pointRadius: 3,
        },
        {
          label: 'Total Investment',
          data: new Array(years.length).fill(totalInvestment),
          borderColor: '#c0392b',
          borderDash: [10, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  // Update ROI KPIs
  const roiKPIs = document.getElementById('roiKPIs');
  const roiPercentages = [
    { year: 1, roi: annualProfit / totalInvestment * 100 },
    { year: 3, roi: annualProfit * 3 / totalInvestment * 100 },
    { year: 5, roi: annualProfit * 5 / totalInvestment * 100 }
  ];
  roiKPIs.innerHTML = '<h3>ROI Percentages</h3><ul>' + roiPercentages.map(item => {
    return `<li>Year ${item.year}: ${isFinite(item.roi) ? item.roi.toFixed(1) + '%' : 'N/A'}</li>`;
  }).join('') + '</ul>';
}
window.updateROI = updateROI;

// --- Tornado Chart (Sensitivity Analysis) ---
function drawTornadoChart() {
  const keyVars = [
    { label: 'Padel Utilization', id: 'padelPeakUtil', base: getNumberInputValue('padelPeakUtil') },
    { label: 'Padel Fee', id: 'padelPeakRate', base: getNumberInputValue('padelPeakRate') },
    { label: 'Padel Staff Salary', id: 'padelFtMgrSal', base: getNumberInputValue('padelFtMgrSal') },
    { label: 'Gym Utilization', id: 'gymWeekMembers', base: getNumberInputValue('gymWeekMembers') },
    { label: 'Gym Fee', id: 'gymWeekFee', base: getNumberInputValue('gymWeekFee') },
    { label: 'Gym Staff Salary', id: 'gymFtTrainerSal', base: getNumberInputValue('gymFtTrainerSal') }
  ];
  const impacts = keyVars.map(v => {
    const orig = getNumberInputValue(v.id);
    let minVal = Math.max(0, orig * 0.8), maxVal = orig * 1.2;
    document.getElementById(v.id).value = minVal;
    calculatePadel(); calculateGym();
    const low = (window.padelData?.profit || 0) + (gymIncluded() ? (window.gymData?.profit || 0) : 0);
    document.getElementById(v.id).value = maxVal;
    calculatePadel(); calculateGym();
    const high = (window.padelData?.profit || 0) + (gymIncluded() ? (window.gymData?.profit || 0) : 0);
    document.getElementById(v.id).value = orig;
    calculatePadel(); calculateGym();
    return Math.abs(high - low);
  });
  if (tornadoChart) tornadoChart.destroy();
  const ctx = document.getElementById('tornadoChart').getContext('2d');
  tornadoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: keyVars.map(v => v.label),
      datasets: [{
        label: 'Impact on Net Profit (€)',
        data: impacts,
        backgroundColor: '#f39c12'
      }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });
}

// --- Scenario Management ---
function getScenarioState() {
  const ids = padelInputIds.concat(gymInputIds);
  const state = {};
  ids.forEach(id => state[id] = getNumberInputValue(id));
  state['roiRevAdjust'] = getNumberInputValue('roiRevAdjust');
  state['roiCostAdjust'] = getNumberInputValue('roiCostAdjust');
  state['scenarioTimestamp'] = Date.now();
  return state;
}
function setScenarioState(state) {
  Object.keys(state).forEach(id => {
    if (document.getElementById(id)) document.getElementById(id).value = state[id];
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
  scenarios.forEach((s, i) => { if (document.getElementById('diff' + i)?.checked) indices.push(i); });
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

// --- Summary Report (for PDF/Excel) ---
function generateSummaryReport() {
  const padel = window.padelData || {};
  const gym = gymIncluded() && window.gymData ? window.gymData : {};
 document.getElementById('reportContent').innerHTML = `
  <h3>Key Financials</h3>
  <ul>
    <li><b>Padel Revenue:</b> €${(padel.revenue || 0).toLocaleString()}</li>
    <li><b>Padel Net Profit:</b> €${(padel.profit || 0).toLocaleString()}</li>
    <li><b>Gym Revenue:</b> €${(gym.revenue || 0).toLocaleString()}</li>
    <li><b>Gym Net Profit:</b> €${(gym.profit || 0).toLocaleString()}</li>
    ${document.getElementById('gymRamp')?.checked ? `<li><b>Ramp-Up:</b> ${getNumberInputValue('rampDuration')} months at ${getNumberInputValue('rampEffect')}%</li>` : ""}
    <li><b>Total Investment:</b> €${getTotalInvestment().toLocaleString()}</li>
  </ul>
    <div><canvas id="summaryPnL" height="150"></canvas></div>
    <div><canvas id="summaryROI" height="150"></canvas></div>
    <h3>Assumptions</h3>
    <ul>
      <li>Padel Peak Utilization: ${getNumberInputValue('padelPeakUtil')}%</li>
      <li>Padel Peak Rate: €${getNumberInputValue('padelPeakRate')}</li>
      <li>Gym Weekly Members: ${getNumberInputValue('gymWeekMembers')}</li>
      <li>Gym Weekly Fee: €${getNumberInputValue('gymWeekFee')}</li>
    </ul>
  `;
  if (window.summaryPnLChart) window.summaryPnLChart.destroy();
  if (window.summaryROIChart) window.summaryROIChart.destroy();
  window.summaryPnLChart = new Chart(document.getElementById('summaryPnL').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Padel Profit', 'Gym Profit'],
      datasets: [{label: 'Net Profit', data: [padel.profit || 0, gymIncluded() ? (gym.profit || 0) : 0], backgroundColor: ['#4caf50', '#2980b9']}]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  window.summaryROIChart = new Chart(document.getElementById('summaryROI').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Padel Investment', 'Gym Investment'],
      datasets: [{
        data: [
          getNumberInputValue('padelGround') + getNumberInputValue('padelStructure') + (getNumberInputValue('padelCourts') * getNumberInputValue('padelCourtCost')) + getNumberInputValue('padelAmenities'),
          gymIncluded() ? (getNumberInputValue('gymEquip') + getNumberInputValue('gymFloor') + getNumberInputValue('gymAmen')) : 0
        ],
        backgroundColor: ['#f39c12', '#3498db']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
// --- Export as PDF ---
window.exportPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.html(document.getElementById('reportContent'), {
    callback: function (pdf) { pdf.save("Investment_Summary.pdf"); },
    x: 10, y: 10
  });
};
// --- Export as Excel ---
window.exportExcel = function() {
  const wb = XLSX.utils.book_new();
  const table = document.getElementById('monthlyBreakdown');
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "Monthly Breakdown");
  XLSX.writeFile(wb, "Investment_Breakdown.xlsx");
};

// ------- Interactive Gantt: Add/Edit/Remove tasks, save in localStorage -------
let ganttTasks = [];
const ganttKey = 'userGanttTasks';
let currentViewMode = 'Month';

// --- Gantt LocalStorage ---
function loadGanttTasks() {
  const saved = localStorage.getItem(ganttKey);
  if (saved) {
    ganttTasks = JSON.parse(saved);
  } else {
    ganttTasks = [
      { id: '1', name: 'Feasibility Study & Business Plan', start: '2025-01-01', end: '2025-01-21', progress: 100 },
      { id: '2', name: 'Site Selection & Acquisition', start: '2025-01-22', end: '2025-02-15', progress: 100 },
      { id: '3', name: 'Planning & Permits', start: '2025-02-16', end: '2025-03-10', progress: 80 },
      { id: '4', name: 'Design & Engineering', start: '2025-02-20', end: '2025-03-25', progress: 60 }
    ];
  }
}
function saveGanttTasks() {
  localStorage.setItem(ganttKey, JSON.stringify(ganttTasks));
}

// --- Gantt Task List Render ---
function renderGanttTaskList() {
  const list = document.getElementById('ganttTaskList');
  list.innerHTML = '';
  ganttTasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'gantt-task-row';
    row.innerHTML = `
      <span class="gantt-task-name">${task.name}</span>
      <span class="gantt-task-start">${task.start}</span>
      <span class="gantt-task-end">${task.end}</span>
      <span class="gantt-task-progress">${task.progress}%</span>
      <div class="gantt-actions">
        <button class="gantt-action-btn" onclick="editGanttTask('${task.id}')">Edit</button>
        <button class="gantt-action-btn" onclick="deleteGanttTask('${task.id}')">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });
}

// --- Gantt Edit/Delete/Validation ---
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
  if (new Date(start) > new Date(end)) {
    alert('End date must be after start date.');
    return;
  }
  const progress = Number(document.getElementById('ganttTaskProgress').value);
  const idx = ganttTasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    ganttTasks[idx] = { id, name, start, end, progress };
  } else {
    ganttTasks.push({ id, name, start, end, progress });
  }
  saveGanttTasks();
  renderGanttTaskList();
  drawGantt();
  this.reset();
  document.getElementById('ganttEditId').value = '';
};
document.getElementById('ganttTaskResetBtn').onclick = function() {
  document.getElementById('ganttEditId').value = '';
  document.getElementById('ganttTaskForm').reset();
};

// --- Gantt View Modes ---
window.setGanttViewMode = function(mode) {
  currentViewMode = mode;
  drawGantt();
};

// --- Gantt Export CSV ---
window.exportGanttCSV = function() {
  let csv = "Name,Start,End,Progress\n";
  ganttTasks.forEach(t => {
    csv += `${t.name},${t.start},${t.end},${t.progress}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Gantt_Tasks.csv";
  link.click();
};

// --- Gantt Draw & Inline Progress, Highlight Today ---
function drawGantt() {
  loadGanttTasks();
  const ganttContainer = document.getElementById('ganttContainer');
  ganttContainer.innerHTML = "";
  const ganttDiv = document.createElement('div');
  ganttDiv.id = "ganttChartDiv";
  ganttContainer.appendChild(ganttDiv);
  if (ganttTasks.length > 0) {
    const gantt = new Gantt("#ganttChartDiv", ganttTasks, {
      view_mode: currentViewMode,
      on_progress_change: (task, progress) => {
        const idx = ganttTasks.findIndex(t => t.id === task.id);
        if (idx >= 0) {
          ganttTasks[idx].progress = progress;
          saveGanttTasks();
          renderGanttTaskList();
        }
      }
    });
    setTimeout(highlightToday, 100);
  }
}
function highlightToday() {
  const today = new Date().toISOString().slice(0, 10);
  const labels = document.querySelectorAll('.gantt .grid .grid-row .grid-date');
  labels.forEach(label => {
    if (label.dataset && label.dataset.date === today) {
      label.classList.add('gantt-today-highlight');
    }
  });
}

// --- Initialization ---
window.onload = function () {
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', function () {
      showTab(this.dataset.tab || this.getAttribute('aria-controls'));
    });
  });
  showTab('padel');
  document.getElementById('calculatePadelBtn')?.addEventListener('click', calculatePadel);
  document.getElementById('calculateGymBtn')?.addEventListener('click', calculateGym);
  document.getElementById('includeGym')?.addEventListener('change', updatePnL);
  document.getElementById('includeGymROI')?.addEventListener('change', updateROI);
  document.getElementById('ganttTaskResetBtn')?.addEventListener('click', function() {
    document.getElementById('ganttEditId').value = '';
    document.getElementById('ganttTaskForm').reset();
  });
  document.getElementById('exportGanttCSVBtn')?.addEventListener('click', exportGanttCSV);
  calculatePadel();
  calculateGym();
  renderScenarioList?.();
  renderScenarioDiff?.();
  renderGanttTaskList();
  drawGantt();
};
document.querySelectorAll('.collapsible-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    const content = document.getElementById(this.getAttribute('aria-controls'));
    if (expanded) {
      content.classList.add('collapsed');
      this.textContent = '► ' + this.textContent.replace(/^▼|^►/, '').trim();
    } else {
      content.classList.remove('collapsed');
      this.textContent = '▼ ' + this.textContent.replace(/^▼|^►/, '').trim();
    }
  });
});
