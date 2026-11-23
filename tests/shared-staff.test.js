const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createPlanner() {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id, value: '', checked: false, innerHTML: '', textContent: '', handlers: {},
        classList: { toggle() {} },
        addEventListener(event, handler) { this.handlers[event] = handler; },
        setCustomValidity(message) { this.validationMessage = message; },
        reportValidity() {},
        insertAdjacentHTML(_position, content) { this.innerHTML += content; },
        getContext() { return {}; },
        appendChild() {}
      });
    }
    return elements.get(id);
  }
  for (const tag of html.matchAll(/<input\b[^>]*>/g)) {
    const id = tag[0].match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    element(id).value = tag[0].match(/\bvalue="([^"]*)"/)?.[1] || '';
    element(id).checked = /\bchecked\b/.test(tag[0]);
  }
  const document = {
    getElementById: element,
    querySelector: element,
    querySelectorAll: () => [],
    createElement: () => element('created')
  };
  const storage = new Map();
  const context = {
    document,
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    Chart: class { constructor(_ctx, config) { this.config = config; } destroy() {} },
    Gantt: class {},
    alert: message => { throw new Error(message); },
    setTimeout() {},
    console
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'script.js'), 'utf8'), context);
  context.onload();
  return { context, element };
}

test('shared staff costs feed PnL, cash flow and ROI exactly once, including without gym', () => {
  const { context: p, element: el } = createPlanner();
  assert.equal(p.padelData.staffCost, 72000);
  assert.equal(p.sharedStaffData.total, 21000);
  assert.match(el('pnlSummary').innerHTML, /279,000/);

  el('receptionPt').value = '2';
  el('receptionPtSal').value = '10000';
  el('directorCount').value = '2';
  el('directorSalary').value = '30000';
  el('directorStaff').handlers.change();
  assert.equal(p.sharedStaffData.total, 101000);
  assert.match(el('staffSummary').innerHTML, /204,000/);
  assert.match(el('pnlSummary').innerHTML, /359,000/);
  assert.match(el('#monthlyBreakdown tbody').innerHTML, /€29916\.67/);
  assert.match(el('#cashFlowTable tbody').innerHTML, /€29916\.67/);
  assert.match(el('#paybackTable tbody').innerHTML, /€913400\.00/);

  el('includeGym').checked = false;
  el('includeGymROI').checked = false;
  p.updatePnL();
  p.updateROI();
  assert.match(el('pnlSummary').innerHTML, /248,000/);
  assert.match(el('#paybackTable tbody').innerHTML, /€205600\.00/);
  el('roiCostAdjust').value = '150';
  p.updateROI();
  assert.equal(vm.runInContext('roiBarChart.config.data.datasets[0].data[2]', p), -151500);
});

test('saved scenarios preserve old reception values and reset new shared fields for legacy scenarios', () => {
  const { context: p, element: el } = createPlanner();
  el('padelFtRec').value = '3';
  el('padelFtRecSal').value = '20000';
  const legacy = p.getScenarioState();
  delete legacy.receptionPt;
  delete legacy.receptionPtSal;
  delete legacy.directorCount;
  delete legacy.directorSalary;
  el('receptionPt').value = '2';
  el('receptionPtSal').value = '10000';
  el('directorCount').value = '2';
  el('directorSalary').value = '30000';
  const current = p.getScenarioState();
  p.setScenarioState(legacy);
  assert.equal(p.sharedStaffData.total, 60000);
  assert.equal(el('directorCount').value, '0');
  assert.equal(el('receptionPt').value, '0');
  p.setScenarioState(current);
  assert.equal(p.sharedStaffData.total, 140000);
});

test('ROI distinguishes cumulative profit return from net return on investment', () => {
  const { context: p, element: el } = createPlanner();
  for (const id of ['padelStructure', 'padelCourts', 'padelAmenities', 'gymEquip', 'gymFloor', 'gymAmen']) {
    el(id).value = '0';
  }
  el('padelGround').value = '100000';
  el('landPurchaseCost').value = '50000';
  el('buildingPurchaseCost').value = '50000';
  p.padelData = { revenue: 70000, costs: 10000 };
  p.gymData = { revenue: 30000, costs: 9000 };
  p.sharedStaffData = { total: 21000 };
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>30\.0%<\/td><td>-70\.0%/);
  assert.match(el('roiKPIs').innerHTML, /Year 3<\/td><td>90\.0%<\/td><td>-10\.0%/);
  assert.match(el('roiKPIs').innerHTML, /Year 5<\/td><td>150\.0%<\/td><td>50\.0%/);

  el('gymEquip').value = '50000';
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>24\.0%<\/td><td>-76\.0%/);
  el('includeGymROI').checked = false;
  el('roiCostAdjust').value = '200';
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>4\.0%<\/td><td>-96\.0%/);
  el('roiRevAdjust').value = '0';
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>-31\.0%<\/td><td>-131\.0%/);

  p.padelData = { revenue: 100000, costs: 0 };
  p.sharedStaffData = { total: 0 };
  el('roiRevAdjust').value = '100';
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>50\.0%<\/td><td>-50\.0%/);
  assert.match(el('yearsToROIText').innerHTML, /2 year/);
  p.padelData.revenue = 200000;
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>100\.0%<\/td><td>0\.0%/);

  el('padelGround').value = '0';
  el('landPurchaseCost').value = '0';
  el('buildingPurchaseCost').value = '0';
  p.updateROI();
  assert.match(el('roiKPIs').innerHTML, /Year 1<\/td><td>N\/A<\/td><td>N\/A/);
  assert.match(el('roiKPIs').innerHTML, /initial investment is zero/);
});

test('gym ramp affects individual months and the lease reduces cash flow and ROI', () => {
  const { context: p, element: el } = createPlanner();
  el('openingCash').value = '12000';
  el('investorLease').value = '120000';
  el('investorLease').handlers.change();
  el('gymRamp').checked = true;
  el('rampDuration').value = '3';
  el('rampEffect').value = '40';
  el('gymRamp').handlers.change();

  assert.equal(p.gymData.revenue, 695980);
  assert.match(el('pnlSummary').innerHTML, /399,000/);
  const rows = el('#monthlyBreakdown tbody').innerHTML.match(/<tr>.*?<\/tr>/g);
  assert.match(rows[0], /€65093\.33/);
  assert.match(rows[2], /€65093\.33/);
  assert.match(rows[3], /€106033\.33/);
  assert.ok(Math.abs(vm.runInContext('profitTrendChart.config.data.datasets[0].data[0]', p) - (65093.3333333333 - 33250)) < 0.001);
  assert.match(el('#cashFlowTable tbody').innerHTML, /<tr><td>1<\/td><td>€12000\.00<\/td><td>€65093\.33<\/td><td>€33250\.00<\/td><td>€43843\.33/);
  assert.match(el('investmentFundingSummary').textContent, /655,000/);
  assert.match(el('roiKPIs').innerHTML, /investor-funded setup cost/);
  assert.equal(vm.runInContext('roiBarChart.config.data.datasets[0].data[3]', p), -120000);
  el('includeGym').checked = false;
  p.updatePnL();
  assert.match(el('investmentFundingSummary').textContent, /260,000/);
  assert.match(el('pnlSummary').innerHTML, /Investor Lease:<\/b> €120,000/);
  el('includeGymROI').checked = false;
  p.updateROI();
  assert.equal(vm.runInContext('roiBarChart.config.data.datasets[0].data[3]', p), -120000);
  el('roiCostAdjust').value = '150';
  p.updateROI();
  assert.equal(vm.runInContext('roiBarChart.config.data.datasets[0].data[3]', p), -180000);
});

test('gym ramp handles zero and full year durations and can be disabled', () => {
  const { context: p, element: el } = createPlanner();
  el('gymRamp').checked = true;
  el('rampDuration').value = '0';
  el('rampEffect').value = '0';
  p.calculateGym();
  assert.ok(Math.abs(p.gymData.revenue - 818800) < 0.001);
  el('rampDuration').value = '12';
  p.calculateGym();
  assert.equal(p.gymData.revenue, 0);
  assert.ok(p.gymData.monthlyRevenues.every(revenue => revenue === 0));
  el('gymRamp').checked = false;
  p.calculateGym();
  assert.ok(Math.abs(p.gymData.revenue - 818800) < 0.001);
});

test('cash flow and ramp settings round-trip and legacy scenarios restore defaults', () => {
  const { context: p, element: el } = createPlanner();
  el('openingCash').value = '5000';
  el('investorLease').value = '48000';
  el('openingCash').handlers.change();
  el('gymRamp').checked = true;
  el('rampDuration').value = '6';
  el('rampEffect').value = '25';
  p.calculateGym();
  const saved = p.getScenarioState();
  const old = { ...saved };
  for (const id of ['openingCash', 'investorLease', 'gymRamp', 'rampDuration', 'rampEffect']) delete old[id];
  p.setScenarioState(old);
  assert.equal(el('gymRamp').checked, false);
  assert.equal(el('openingCash').value, '0');
  assert.match(el('pnlSummary').innerHTML, /Investor Lease:<\/b> €0/);
  p.setScenarioState(saved);
  assert.equal(el('gymRamp').checked, true);
  assert.equal(el('rampDurationLabel').textContent, '6');
  assert.equal(el('rampEffectLabel').textContent, '25%');
  assert.match(el('pnlSummary').innerHTML, /Investor Lease:<\/b> €48,000/);
  assert.match(el('#cashFlowTable tbody').innerHTML, /<tr><td>1<\/td><td>€5000\.00/);
  el('investorLease').value = '-10';
  el('investorLease').handlers.change();
  assert.match(el('investorLease').validationMessage, /non-negative/);
  assert.match(el('pnlSummary').innerHTML, /Investor Lease:<\/b> €48,000/);
});
