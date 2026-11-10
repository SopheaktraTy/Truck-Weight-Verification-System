/**
 * Unit Test for Calculator Logic
 * Verifies calculations against actual records from the Excel file
 */

const assert = require('assert');

function calculateLineItem(item) {
  const qty = Number(item.quantity) || 0;
  const unitWeight = Number(item.unitWeightKg) || 0;
  const totalWeightKg = Math.round(qty * unitWeight * 1000) / 1000;
  const totalWeightTon = Math.round((totalWeightKg / 1000) * 10000) / 10000;
  return { ...item, quantity: qty, unitWeightKg: unitWeight, totalWeightKg, totalWeightTon };
}

function verifyTruckWeight(scaleInKg, scaleOutKg, rawItems, tolerancePercent = 0.40) {
  const sIn = Number(scaleInKg) || 0;
  const sOut = Number(scaleOutKg) || 0;

  const items = rawItems
    .filter(i => (Number(i.quantity) || 0) > 0)
    .map(calculateLineItem);

  const scaleNetKg = Math.round(Math.abs(sOut - sIn) * 100) / 100;
  const warehouseTotalKg = Math.round(
    items.reduce((sum, item) => sum + item.totalWeightKg, 0) * 100
  ) / 100;

  const diffKg = Math.round((scaleNetKg - warehouseTotalKg) * 100) / 100;
  let diffPercent = 0;
  if (scaleNetKg > 0) {
    diffPercent = Math.round((diffKg / scaleNetKg) * 100 * 1000) / 1000;
  }

  const isApproved = Math.abs(diffPercent) <= tolerancePercent;
  const status = isApproved ? 'អនុញ្ញាត' : 'ត្រួតពិនិត្យ';

  const roundedDiff = Math.round(Math.abs(diffKg));
  const statusMessage = diffKg < 0 ? `ខ្វះ (-${roundedDiff}) គីឡូ` : `លើស ${roundedDiff} គីឡូ`;

  return { items, scaleInKg: sIn, scaleOutKg: sOut, scaleNetKg, warehouseTotalKg, diffKg, diffPercent, isApproved, status, statusMessage };
}

console.log('------------------------------------------------------------');
console.log('RUNNING VERIFICATION TESTS AGAINST REAL EXCEL RECORDS');
console.log('------------------------------------------------------------');

// TEST 1: Real Excel Truck Record (Rows 58-60: Plate 3I-7899, HB)
// Products:
// - King Kong: 1365 cases * 6.65 kg = 9077.25 kg
// - King Kong Ice: 1170 cases * 6.50 kg = 7605.00 kg
// - Plastic Pallet Hanuman: 16 pcs * 19.70 kg = 315.20 kg
// Scale Net: 17,130 kg (In: 12,500, Out: 29,630)
// Expected:
// - Warehouse Total = 16,997.45 kg
// - Difference = +132.55 kg (+0.774%)
// - Status: ត្រួតពិនិត្យ (Inspection Required because > 0.4%)
// - Message: លើស 133 គីឡូ
const test1 = verifyTruckWeight(12500, 29630, [
  { productId: '1', productNameKh: 'គីងកុង', productNameEn: 'King Kong', quantity: 1365, unitWeightKg: 6.65 },
  { productId: '2', productNameKh: 'គីងកុងអាយស៏', productNameEn: 'King Kong Ice', quantity: 1170, unitWeightKg: 6.50 },
  { productId: '3', productNameKh: 'ប៉ាឡែតជ័រ ហនុមាន', productNameEn: 'Plastic Pallet Hanuman', quantity: 16, unitWeightKg: 19.70 },
]);

console.log('\nTEST 1 (Real Record from Excel Row 58-60 - Plate 3I-7899):');
console.log('Scale Net:', test1.scaleNetKg, 'Kg (Expected: 17130)');
console.log('Warehouse Total:', test1.warehouseTotalKg, 'Kg (Expected: 16997.45)');
console.log('Difference:', test1.diffKg, 'Kg (Expected: 132.55)');
console.log('Difference %:', test1.diffPercent, '% (Expected: 0.774)');
console.log('Status:', test1.status, '(Expected: ត្រួតពិនិត្យ)');
console.log('Message:', test1.statusMessage, '(Expected: លើស 133 គីឡូ)');

assert.strictEqual(test1.scaleNetKg, 17130);
assert.strictEqual(test1.warehouseTotalKg, 16997.45);
assert.strictEqual(test1.diffKg, 132.55);
assert.strictEqual(test1.diffPercent, 0.774);
assert.strictEqual(test1.status, 'ត្រួតពិនិត្យ');
assert.strictEqual(test1.statusMessage, 'លើស 133 គីឡូ');
console.log('✅ TEST 1 PASSED EXACTLY AS RECORDED IN EXCEL!');

// TEST 2: Approved Truck within Tolerance (<= 0.40%)
// Scale Net: 10,000 Kg
// Warehouse: 10,025 Kg (Diff = -25 Kg = -0.25%, within 0.40%)
// Expected: Status: អនុញ្ញាត (Approved), Message: ខ្វះ (-25) គីឡូ
const test2 = verifyTruckWeight(10000, 20000, [
  { productId: '1', productNameKh: 'គីងកុង', productNameEn: 'King Kong', quantity: 1500, unitWeightKg: 6.65 }, // 9975 kg
  { productId: '2', productNameKh: 'ប៉ាឡែតជ័រ ហនុមាន', productNameEn: 'Plastic Pallet Hanuman', quantity: 2.53807, unitWeightKg: 19.70 }, // 50 kg
]);

console.log('\nTEST 2 (Underweight Truck - Within Tolerance <= 0.4%):');
console.log('Scale Net:', test2.scaleNetKg, 'Kg');
console.log('Warehouse Total:', test2.warehouseTotalKg, 'Kg');
console.log('Difference:', test2.diffKg, 'Kg');
console.log('Difference %:', test2.diffPercent, '%');
console.log('Status:', test2.status, '(Expected: អនុញ្ញាត)');
console.log('Message:', test2.statusMessage, '(Expected: ខ្វះ (-25) គីឡូ)');

assert.strictEqual(test2.status, 'អនុញ្ញាត');
assert.strictEqual(test2.statusMessage, 'ខ្វះ (-25) គីឡូ');
console.log('✅ TEST 2 PASSED!');

console.log('\n------------------------------------------------------------');
console.log('ALL UNIT TESTS MATCH EXCEL LOGIC 100%!');
console.log('------------------------------------------------------------');
