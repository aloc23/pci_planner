// Global Chart instances to update/destroy as needed
let pnlChart, profitTrendChart, costPieChart;
let roiLineChart, roiBarChart, roiPieChart, roiBreakEvenChart;

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== tabId);
  });
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'btn' + capitalize(tabId));
  });
  if (tabId === 'pnl') updatePnL();
  if (tabId === 'roi') updateROI();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// -- Padel Calculations --

function calculatePadel() {
  const peakHours = +document.getElementById('padelPeakHours').value;
  const peakRate = +document.getElementById('padelPeakRate').value;
  const peakUtil = +document.getElementById('padelPeakUtil').value / 100;

  const offHours = +document.getElementById('padelOffHours').value;
  const offRate = +document.getElementById('padelOffRate').value;
  const offUtil = +document.getElementById('padelOffUtil').value / 100;

  const days = +document.getElementById('padelDays').value;
  const weeks = +document.getElementById('padelWeeks').value;
  const courts = +document.getElementById('padelCourts').value || 1;

  const peakAnnualRevenue = peakHours * peakRate * days * weeks * courts * peakUtil;
  const offAnnualRevenue = offHours * offRate * days * weeks * courts * offUtil;

  const totalAnnualRevenue = peakAnnualRevenue + offAnnualRevenue;
  const totalRevenue = totalAnnualRevenue;

  const utilCost = +document.getElementById('padelUtil').value;
  const insureCost = +document.getElementById('padelInsure').value;
  const maintCost = +document.getElementById('padelMaint').value;
  const marketCost = +document.getElementById('padelMarket').value;
  const adminCost = +document.getElementById('padelAdmin').value;
  const cleanCost = +document.getElementById('padelClean').value;
  const miscCost = +document.getElementById('padelMisc').value;

  const totalOpCosts = utilCost + insureCost + maintCost + marketCost + adminCost + cleanCost + miscCost;

  const ftMgr = +document.getElementById('padelFtMgr').value;
  const ftMgrSal = +document.getElementById('padelFtMgrSal').value;
  const ftRec = +document.getElementById('padelFtRec').value;
  const ftRecSal = +document.getElementById('padelFtRecSal').value;
  const ftCoach = +document.getElementById('padelFtCoach').value;
  const ftCoachSal = +document.getElementById('padelFtCoachSal').value;
  const ptCoach = +document.getElementById('padelPtCoach').value;
  const ptCoachSal = +document.getElementById('padelPtCoachSal').value;
  const addStaff = +document.getElementById('padelAddStaff').value;
  const addStaffSal = +document.getElementById('padelAddStaffSal').value;

  const totalStaffCost =
    ftMgr * ftMgrSal +
    ftRec * ftRecSal +
    ftCoach * ftCoachSal +
    ptCoach * ptCoachSal +
    addStaff * addStaffSal;

  const netProfit = totalRevenue - totalOpCosts - totalStaffCost;

  const summaryDiv = document.getElementById('padelSummary');
  summaryDiv.innerHTML = `
  <h3>Summary</h3>
  <p><b>Total Revenue:</b> €${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Operational Costs:</b> €${totalOpCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Staff Costs:</b> €${totalStaffCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Net Profit:</b> €${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
`;

  window.padelData = {
    revenue: totalRevenue,
    costs: totalOpCosts + totalStaffCost,
    profit: netProfit,
    monthlyRevenue: totalRevenue / 12,
    monthlyCosts: (totalOpCosts + totalStaffCost) / 12,
    monthlyProfit: netProfit / 12,
  };

  updatePnL();
  updateROI();
}
// -- Gym Calculations --

function calculateGym() {
  const weekMembers = +document.getElementById('gymWeekMembers').value;
  const weekFee = +document.getElementById('gymWeekFee').value;
  const monthMembers = +document.getElementById('gymMonthMembers').value;
  const monthFee = +document.getElementById('gymMonthFee').value;
  const annualMembers = +document.getElementById('gymAnnualMembers').value;
  const annualFee = +document.getElementById('gymAnnualFee').value;

  const weeklyRevenueAnnual = weekMembers * weekFee * 52;
  const monthlyRevenueAnnual = monthMembers * monthFee * 12;
  const annualRevenueAnnual = annualMembers * annualFee;

  const totalAnnualRevenue = weeklyRevenueAnnual + monthlyRevenueAnnual + annualRevenueAnnual;

  // Operational costs
  const utilCost = +document.getElementById('gymUtil').value;
  const insureCost = +document.getElementById('gymInsure').value;
  const maintCost = +document.getElementById('gymMaint').value;
  const marketCost = +document.getElementById('gymMarket').value;
  const adminCost = +document.getElementById('gymAdmin').value;
  const cleanCost = +document.getElementById('gymClean').value;
  const miscCost = +document.getElementById('gymMisc').value;

  const totalOpCosts = utilCost + insureCost + maintCost + marketCost + adminCost + cleanCost + miscCost;

  // Staff costs
  const ftTrainer = +document.getElementById('gymFtTrainer').value;
  const ftTrainerSal = +document.getElementById('gymFtTrainerSal').value;
  const ptTrainer = +document.getElementById('gymPtTrainer').value;
  const ptTrainerSal = +document.getElementById('gymPtTrainerSal').value;
  const addStaff = +document.getElementById('gymAddStaff').value;
  const addStaffSal = +document.getElementById('gymAddStaffSal').value;

  const totalStaffCost =
    ftTrainer * ftTrainerSal +
    ptTrainer * ptTrainerSal +
    addStaff * addStaffSal;

  // Ramp-up adjustment
  let adjustedAnnualRevenue = totalAnnualRevenue;
  if (document.getElementById('gymRamp').checked) {
    const rampDuration = +document.getElementById('rampDuration').value;
    const rampEffect = +document.getElementById('rampEffect').value / 100;
    let rampedRevenue = 0;
    for (let i = 1; i <= 12; i++) {
      if (i <= rampDuration) {
        rampedRevenue += totalAnnualRevenue * (rampEffect * (i / rampDuration));
      } else {
        rampedRevenue += totalAnnualRevenue;
      }
    }
    adjustedAnnualRevenue = rampedRevenue / 12 * 12; // yearly average after ramp
  }

  const netProfit = adjustedAnnualRevenue - totalOpCosts - totalStaffCost;

  const summaryDiv = document.getElementById('gymSummary');
 summaryDiv.innerHTML = `
  <h3>Summary</h3>
  <p><b>Annual Revenue:</b> €${adjustedAnnualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Operational Costs:</b> €${totalOpCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Staff Costs:</b> €${totalStaffCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
  <p><b>Net Profit:</b> €${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
`;

  window.gymData = {
    revenue: adjustedAnnualRevenue,
    costs: totalOpCosts + totalStaffCost,
    profit: netProfit,
    monthlyRevenue: adjustedAnnualRevenue / 12,
    monthlyCosts: (totalOpCosts + totalStaffCost) / 12,
    monthlyProfit: netProfit / 12,
  };

  updatePnL();
  updateROI();
}

// -- Profit and Loss --

function updatePnL() {
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
  
  const tbody = document.querySelector('#monthlyBreakdown tbody');
  tbody.innerHTML = '';

  if (plType === 'monthly') {
    for(let i=1; i<=12; i++) {
      const rev = (padel.monthlyRevenue + gym.monthlyRevenue);
      const costs = (padel.monthlyCosts + gym.monthlyCosts);
      const profit = (padel.monthlyProfit + gym.monthlyProfit);
      const row = `<tr><td>${i}</td><td>€${rev.toFixed(2)}</td><td>€${costs.toFixed(2)}</td><td>€${profit.toFixed(2)}</td></tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    }
  } else {
    tbody.innerHTML = '<tr><td colspan="4">Switch to monthly view to see breakdown</td></tr>';
  }

  if(pnlChart) pnlChart.destroy();
  if(profitTrendChart) profitTrendChart.destroy();
  if(costPieChart) costPieChart.destroy();

  // PnL Chart: Revenue, Costs, Profit (bar chart)
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
    options: { responsive:true, maintainAspectRatio:false }
  });

  // Profit Trend Line Chart
  const ctxProfitTrend = document.getElementById('profitTrendChart').getContext('2d');
  const monthlyProfits = new Array(12).fill(totalProfit / 12);
  const annualProfits = new Array(10).fill(totalProfit);

  profitTrendChart = new Chart(ctxProfitTrend, {
    type: 'line',
    data: {
      labels: plType === 'monthly' ? [...Array(12).keys()].map(m => `Month ${m+1}`) : [...Array(10).keys()].map(y => `Year ${y+1}`),
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
    options: { responsive:true, maintainAspectRatio:false }
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
    options: { responsive:true, maintainAspectRatio:false }
  });
}

// -- ROI --

function getTotalInvestment() {
  return (
    +document.getElementById('padelGround').value +
    +document.getElementById('padelStructure').value +
    (+document.getElementById('padelCourts').value * +document.getElementById('padelCourtCost').value) +
    +document.getElementById('padelAmenities').value +
    +document.getElementById('gymEquip').value +
    +document.getElementById('gymFloor').value +
    +document.getElementById('gymAmen').value
  );
}

function updateROIAdjustmentLabel() {
  const revAdjust = +document.getElementById('roiRevAdjust').value;
  const costAdjust = +document.getElementById('roiCostAdjust').value;

  document.getElementById('roiRevAdjustLabel').textContent = revAdjust + '%';
  document.getElementById('roiCostAdjustLabel').textContent = costAdjust + '%';

  updateROI();
}

function updateROI() {
  const padel = window.padelData || { revenue: 0, costs: 0, profit: 0 };
  const gym = window.gymData || { revenue: 0, costs: 0, profit: 0 };

  const revAdjust = +document.getElementById('roiRevAdjust').value / 100;
  const costAdjust = +document.getElementById('roiCostAdjust').value / 100;

  const padelAdjProfit = (padel.revenue * revAdjust) - (padel.costs * costAdjust);
  const gymAdjProfit = (gym.revenue * revAdjust) - (gym.costs * costAdjust);

  const padelInvestment =
    +document.getElementById('padelGround').value +
    +document.getElementById('padelStructure').value +
    (+document.getElementById('padelCourts').value * +document.getElementById('padelCourtCost').value) +
    +document.getElementById('padelAmenities').value;

  const gymInvestment =
    +document.getElementById('gymEquip').value +
    +document.getElementById('gymFloor').value +
    +document.getElementById('gymAmen').value;

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
    options: { responsive:true, maintainAspectRatio:false }
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
    options: { responsive:true, maintainAspectRatio:false }
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
    options: { responsive:true, maintainAspectRatio:false }
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
          borderDash: [10,5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: { responsive:true, maintainAspectRatio:false }
  });

  // Update ROI KPIs
  const roiKPIs = document.getElementById('roiKPIs');
  const roiPercentages = [
    {year: 1, roi: annualProfit / totalInvestment * 100},
    {year: 3, roi: annualProfit * 3 / totalInvestment * 100},
    {year: 5, roi: annualProfit * 5 / totalInvestment * 100}
  ];

  roiKPIs.innerHTML = '<h3>ROI Percentages</h3><ul>' + roiPercentages.map(item => {
    return `<li>Year ${item.year}: ${item.roi.toFixed(1)}%</li>`;
  }).join('') + '</ul>';
}

// Initialize and attach events on load
window.onload = () => {
  showTab('padel');

  // Initial calculation for default values
  calculatePadel();
  calculateGym();

  // Set ramp slider labels
  updateRampDurationLabel(document.getElementById('rampDuration').value);
  updateRampEffectLabel(document.getElementById('rampEffect').value);

  // Set ROI adjustment labels
  updateROIAdjustmentLabel();
};


function loadFiles() {
  const folder = document.getElementById("fileFolderSelect").value;
  const list = document.getElementById("fileList");
  const viewer = document.getElementById("fileViewer");
  list.innerHTML = "";
  viewer.hidden = true;
  if (!folder) return;

  fetch('files/' + folder + '/')
    .then(res => res.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.links).filter(l => !l.href.endsWith('/'));
      links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = '<a href="' + link.href + '" target="_blank" onclick="event.preventDefault(); viewFile(\'' + link.href + '\')">' + link.text + '</a>';
        list.appendChild(li);
      });
    });
}

function viewFile(url) {
  const viewer = document.getElementById("fileViewer");
  viewer.src = url;
  viewer.hidden = false;
}
