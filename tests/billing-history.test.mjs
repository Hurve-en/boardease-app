import assert from 'node:assert/strict';
import test from 'node:test';
import { chartBills, chartScale, filterBills, parseBillingHistory, shortDate } from '../src/features/billing-history/model.ts';
import { previewHistory } from '../src/features/billing-history/fixture.ts';

const history = () => structuredClone(previewHistory);

test('filters year and status together and keeps newest bills first', () => {
  assert.equal(filterBills(history().bills, '2026', 'paid').length, 2);
  assert.equal(filterBills(history().bills, '2025', 'all').length, 0);
  assert.equal(filterBills(history().bills, 'all', 'all')[0].billingMonth, '2026-10-01');
});
test('chart uses the last three bills in chronological order without mutating data', () => {
  const bills = history().bills;
  const original = structuredClone(bills);
  assert.deepEqual(chartBills(bills, '2026').map(b => b.billingMonth), ['2026-08-01', '2026-09-01', '2026-10-01']);
  assert.deepEqual(bills, original);
});
test('supports decimal strings returned by PostgreSQL numeric fields', () => {
  const data = history();
  data.bills[0].totalAmount = '5350.00';
  assert.equal(parseBillingHistory(data).bills[0].totalAmount, 5350);
});
test('accepts empty history and unassigned boarding-house information', () => {
  const data = history();
  data.bills = [];
  data.tenant.roomNumber = null;
  data.tenant.boardingHouseName = null;
  assert.equal(parseBillingHistory(data).bills.length, 0);
});
test('rejects invalid amounts and inconsistent payment statuses', () => {
  for (const value of ['', 'abc', null, -1, Infinity, '5.001']) {
    const data = history();
    data.bills[0].totalAmount = value;
    assert.throws(() => parseBillingHistory(data));
  }
  const data = history();
  data.bills[0].status = 'paid';
  assert.throws(() => parseBillingHistory(data));
});
test('rejects impossible dates, duplicate bills and unsupported statuses', () => {
  for (const patch of [{dueDate:'2026-02-30'}, {billingMonth:'2026-10-02'}, {status:'pending'}]) {
    const data = history();
    Object.assign(data.bills[0], patch);
    assert.throws(() => parseBillingHistory(data));
  }
  const data = history();
  data.bills.push({...data.bills[0]});
  assert.throws(() => parseBillingHistory(data));
});
test('date-only labels do not shift with device timezone', () => {
  assert.equal(shortDate('2026-10-10'), '10 Oct');
});
test('chart scales match the reference and handle zero and constant charges', () => {
  assert.deepEqual(chartScale([460, 530, 600]).ticks, [650, 550, 450]);
  assert.deepEqual(chartScale([240, 250, 250]).ticks, [300, 250, 200]);
  for (const values of [[], [0], [0, 0, 0], [250, 250, 250], [99999999.99]]) {
    const scale = chartScale(values);
    assert.ok(Number.isFinite(scale.top) && scale.top > scale.bottom);
    assert.ok(values.every(value => value >= scale.bottom && value <= scale.top));
  }
});

test('chart range identifies both years when all-years selection crosses January', async () => {
  const { chartRange } = await import('../src/features/billing-history/model.ts');
  const dated = dates => dates.map(billingMonth => ({billingMonth}));
  assert.equal(chartRange(dated(['2026-12-01', '2027-01-01', '2027-02-01'])), 'Dec 2026–Feb 2027');
  assert.equal(chartRange(dated(['2026-08-01', '2026-10-01'])), 'Aug–Oct 2026');
  assert.equal(chartRange(dated(['2026-10-01'])), 'Oct 2026');
  assert.equal(chartRange([]), '');
});

test('chart positions keep single points centered and multiple points inside the plot', async () => {
  const { chartX } = await import('../src/features/billing-history/model.ts');
  assert.equal(chartX(0, 1, 220), 110);
  assert.equal(chartX(0, 2, 220), 24);
  assert.equal(chartX(1, 2, 220), 196);
  assert.equal(chartX(1, 3, 220), 110);
  for (const width of [0, 20, 48, 220, 400]) {
    for (let i = 0; i < 3; i++) assert.ok(chartX(i, 3, width) >= 0 && chartX(i, 3, width) <= width);
  }
});
