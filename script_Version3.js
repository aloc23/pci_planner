// Utility functions
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

// Input IDs for validation
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

// Modular cost calculation
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

// Chart instances
let pnlChart, profitTrendChart, costPieChart;
let roiLineChart, roiBarChart, roiPieChart, roiBreakEvenChart;

// Show tabs
window.showTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== tabId);
  });
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'btn' + capitalize(tabId));
  });
  if (tabId === 'pnl') updatePnL();
  if (tabId === 'roi') updateROI();
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Padel calculations
window.calculatePadel = function() {
  const errors = validateInputs(padelInputIds);
  if (errors.length) {
    alert(errors.join('\n'));
    return;
  }

  const peakAnnualRevenue = getNumberInputValue('padelPeakHours') * getNumberInputValue('padelPeakRate') *
    getNumberInputValue('padelDays') * getNumberInputValue('padelWeeks') *
    getNumberInputValue('padelCourts') * (getNumberInputValue('padelPeakUtil') / 100);

  const offAnnualRevenue = getNumberInputValue('padelOffHours') * getNumberInputValue('padelOffRate') *
    getNumberInputValue('padelDays') * getNumberInputValue('padelWeeks') *
    getNumberInputValue('padelCourts') * (getNumberInputValue('padelOffUtil') / 100);

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
  `;
  updatePnL();
  updateROI();
};

// Gym calculations
window.calculateGym = function() {
  const errors = validateInputs(gymInputIds);
  if (errors.length) {
    alert(errors.join('\n'));
    return;
  }

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
  if (document.getElementById('gymRamp').checked) {
    const rampDuration = getNumberInputValue('rampDuration');
    const rampEffect = getNumberInputValue('rampEffect') / 100;
    let rampedRevenue = 0;
    for (let i = 1; i <= 12; i++) {
      if (i <= rampDuration) {
        rampedRevenue += totalAnnualRevenue * (rampEffect * (i / rampDuration));
      } else {
        rampedRevenue += totalAnnualRevenue;
      }
    }
    adjustedAnnualRevenue = (rampedRevenue / 12) * 12;
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
  `;
  updatePnL();
  updateROI();
};

// Profit and loss calculations
window.updatePnL = function() {
  const plType = document.querySelector('input[name="pl_toggle"]:checked').value;
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };
  const gym = window.gymData || { revenue: 0, costs: 0, profit: 0, monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 };

  const totalRevenue = padel.revenue + gym.revenue;
  const totalCosts = padel.costs + gym.costs;
  const totalProfit = padel.profit + gym.profit;

  // EBITDA = Profit + (approximate) Depreciation (assumed 5% investment)
  const totalInvestment = getTotalInvestment();
  const depreciation = totalInvestment * 0.05;
  const ebitda = totalProfit + depreciation;

  const netMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
  const ebitdaMargin = totalRevenue ? (ebitda / totalRevenue) * 100 : 0;

  const summaryDiv = document.getElementById('pnlSummary');
  summaryDiv.innerHTML = `
    <p><b>Total Revenue:</b> €${Math.round(totalRevenue).toLocaleString('en-US')}</p>
    <p><b>Total Costs:</b> €${Math.round(totalCosts).toLocaleString('en-US')}</p>
    <p><b>EBITDA:</b> €${Math.round(ebitda).toLocaleString('en-US')}</p>
    <p><b>Net Profit:</b> €${Math.round(totalProfit).toLocaleString('en-US')}</p>
    <p><b>Net Margin:</b> ${netMargin.toFixed(1)}%</p>
    <p><b>EBITDA Margin:</b> ${ebitdaMargin.toFixed(1)}%</p>
  `;

  // Monthly breakdown
  const tbody = document.querySelector('#monthlyBreakdown tbody');
  tbody.innerHTML = '';
  if (plType === 'monthly') {
    for (let i = 1; i <= 12; i++) {
      const rev = (padel.monthlyRevenue + gym.monthlyRevenue);
      const costs = (padel.monthlyCosts + gym.monthlyCosts);
      const profit = (padel.monthlyProfit + gym.monthlyProfit);
      const row = `<tr><td>${i}</td><td>€${rev.toFixed(2)}</td><td>€${costs.toFixed(2)}</td><td>€${profit.toFixed(2)}</td></tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    }
  } else {
    tbody.innerHTML = '<tr><td colspan="4">Switch to monthly view to see breakdown</td></tr>';
  }

  // Destroy previous charts if exist
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
  const annualProfits = new Array(10).fill(totalProfit);

  profitTrendChart = new Chart(ctxProfitTrend, {
    type: 'line',
    data: {
      labels: plType === 'monthly' ? [...Array(12).keys()].map(m => `Month ${m + 1}`) : [...Array(10).keys()].map(y => `Year ${y + 1}`),
      datasets: [{
        label: 'Profit',
        data: plType === 'monthly' ? monthlyProfits : annualProfits,
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
};

// ROI
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

window.updateROI = function() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0 };
  const gym = window.gymData || { revenue: 0, costs: 0, profit: 0 };

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

  const totalInvestment = padelInvestment + gymInvestment;
  const annualProfit = padelAdjProfit + gymAdjProfit;
  const paybackYears = annualProfit > 0 ? Math.ceil(totalInvestment / annualProfit) : '∞';

  document.getElementById('yearsToROIText').innerHTML = `<div class="roi-summary">Estimated Payback Period: <b>${paybackYears} year(s)</b></div>`;

  // Prepare arrays for charts
  let cumulativeProfit = 0;
  const years = [...Array(10).keys()].map(i => i + 1);
  const cumulativeProfits = years.map(year => {
    cumulativeProfit += annualProfit;
    return cumulativeProfit;
  });

  // Populate payback table
  const paybackBody = document.querySelector('#paybackTable tbody');
  paybackBody.innerHTML = '';
  cumulativeProfits.forEach((val, idx) => {
    paybackBody.insertAdjacentHTML('beforeend', `<tr><td>${years[idx]}</td><td>€${val.toFixed(2)}</td></tr>`);
  });

  // Destroy previous ROI charts if exist
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
        data: [padelAdjProfit, gymAdjProfit],
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
        data: [padelInvestment, gymInvestment],
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
};

// On window load
window.onload = () => {
  showTab('padel');
  document.getElementById('calculatePadelBtn').addEventListener('click', calculatePadel);
  document.getElementById('calculateGymBtn').addEventListener('click', calculateGym);

  // Set ramp slider labels
  updateRampDurationLabel(document.getElementById('rampDuration').value);
  updateRampEffectLabel(document.getElementById('rampEffect').value);

  // Set ROI adjustment labels
  updateROIAdjustmentLabel();

  calculatePadel();
  calculateGym();
};