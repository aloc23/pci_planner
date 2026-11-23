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
  assert.match(el('pnlSummary').innerHTML, /157,800/);

  el('receptionPt').value = '2';
  el('receptionPtSal').value = '10000';
  el('directorCount').value = '2';
  el('directorSalary').value = '30000';
  el('directorStaff').handlers.change();
  assert.equal(p.sharedStaffData.total, 101000);
  assert.match(el('staffSummary').innerHTML, /204,000/);
  assert.match(el('pnlSummary').innerHTML, /237,800/);
  assert.match(el('#monthlyBreakdown tbody').innerHTML, /€19816\.67/);
  assert.match(el('#cashFlowTable tbody').innerHTML, /€19816\.67/);
  assert.match(el('#paybackTable tbody').innerHTML, /€-10586\.00/);

  el('includeGym').checked = false;
  el('includeGymROI').checked = false;
  p.updatePnL();
  p.updateROI();
  assert.match(el('pnlSummary').innerHTML, /194,000/);
  assert.match(el('#paybackTable tbody').innerHTML, /€-52586\.00/);
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
  assert.equal(el('directorCount').value, 0);
  assert.equal(el('receptionPt').value, 0);
  p.setScenarioState(current);
  assert.equal(p.sharedStaffData.total, 140000);
});
