/**
 * TRUCK WEIGHT VERIFICATION SYSTEM
 * Core Calculation Engine (Replicating Excel sheet formulas)
 */

export interface LineItemInput {
  productId: string;
  productNameKh: string;
  productNameEn: string;
  quantity: number;
  unitWeightKg: number;
}

export interface LineItemCalculated extends LineItemInput {
  totalWeightKg: number; // Excel Column I: Quantity * Unit Weight
  totalWeightTon: number; // Excel Column J: totalWeightKg / 1000
}

export interface VerificationResult {
  items: LineItemCalculated[];
  scaleInKg: number;           // Excel cell R4: ទម្ងន់ឡាន (ចូល)
  scaleOutKg: number;          // Excel cell R5: ទម្ងន់ឡាន (ចេញ)
  scaleNetKg: number;          // Excel cell R6: សរុបទម្ងន់ ពីជញ្ជីង = ScaleOut - ScaleIn
  warehouseTotalKg: number;    // Excel cell R7: សរុបទម្ងន់ ទំនិញពីឃ្លាំង = SUM(I5:I11)
  diffKg: number;              // Excel cell R13: R6 - R7 (ScaleNet - WarehouseTotal)
  diffPercent: number;         // Excel cell R12: (diffKg / scaleNetKg) * 100
  tolerancePercent: number;    // Default: 0.40% (+/- 0.4%)
  isApproved: boolean;         // true if |diffPercent| <= tolerancePercent
  status: 'អនុញ្ញាត' | 'ត្រួតពិនិត្យ'; // Excel cell Q10
  statusMessage: string;       // Excel cell P10: 'លើស X គីឡូ' or 'ខ្វះ (-X) គីឡូ'
}

/**
 * Standard tolerance percentage from Excel: 0.4% (+/- 0.4%)
 */
export const DEFAULT_TOLERANCE_PERCENT = 0.40;

/**
 * Calculates a single item row:
 * - totalWeightKg = quantity * unitWeightKg
 * - totalWeightTon = totalWeightKg / 1000
 */
export function calculateLineItem(item: LineItemInput): LineItemCalculated {
  const qty = Number(item.quantity) || 0;
  const unitWeight = Number(item.unitWeightKg) || 0;
  
  // Total in Kg rounded to 3 decimal places
  const totalWeightKg = Math.round(qty * unitWeight * 1000) / 1000;
  // Total in Ton rounded to 4 decimal places
  const totalWeightTon = Math.round((totalWeightKg / 1000) * 10000) / 10000;

  return {
    ...item,
    quantity: qty,
    unitWeightKg: unitWeight,
    totalWeightKg,
    totalWeightTon,
  };
}

/**
 * Complete Verification Calculation:
 * Replicates Excel Sheet "Data Entry" rows 4 to 13
 */
export function verifyTruckWeight(
  scaleInKg: number,
  scaleOutKg: number,
  rawItems: LineItemInput[],
  tolerancePercent: number = DEFAULT_TOLERANCE_PERCENT
): VerificationResult {
  const sIn = Number(scaleInKg) || 0;
  const sOut = Number(scaleOutKg) || 0;

  // 1. Calculate each item line (Excel columns I & J)
  const items = rawItems
    .filter(i => (Number(i.quantity) || 0) > 0)
    .map(calculateLineItem);

  // 2. Scale Net Weight: Excel cell R6 = R5 - R4
  // If scale outbound is heavier (loaded truck out): scaleOut - scaleIn
  // Using Math.abs ensures correct net cargo weight regardless of weighing sequence
  const scaleNetKg = Math.round(Math.abs(sOut - sIn) * 100) / 100;

  // 3. Warehouse Total Weight: Excel cell R7 = SUM(I5:I11)
  const warehouseTotalKg = Math.round(
    items.reduce((sum, item) => sum + item.totalWeightKg, 0) * 100
  ) / 100;

  // 4. Weight Difference in Kg: Excel cell R13 = R6 - R7
  const diffKg = Math.round((scaleNetKg - warehouseTotalKg) * 100) / 100;

  // 5. Weight Difference in Percentage: Excel cell R12 = (diffKg / scaleNetKg) * 100
  let diffPercent = 0;
  if (scaleNetKg > 0) {
    diffPercent = Math.round((diffKg / scaleNetKg) * 100 * 1000) / 1000; // 3 decimal places e.g. 0.774
  }

  // 6. Tolerance Rule: Excel cell Q10
  // Formula: =IF(R12 > 0.4%, "ត្រួតពិនិត្យ", IF(R12 < -0.4%, "ត្រួតពិនិត្យ", "អនុញ្ញាត"))
  const isApproved = Math.abs(diffPercent) <= tolerancePercent;
  const status: 'អនុញ្ញាត' | 'ត្រួតពិនិត្យ' = isApproved ? 'អនុញ្ញាត' : 'ត្រួតពិនិត្យ';

  // 7. Status Message: Excel cell P10
  // Formula: =IF(R13 < 0, "ខ្វះ (-" & ROUND(R13-(R13*2),0) & ") គីឡូ", "លើស " & ROUND(R13,0) & " គីឡូ")
  let statusMessage = '';
  const roundedDiff = Math.round(Math.abs(diffKg));
  if (diffKg < 0) {
    statusMessage = `ខ្វះ (-${roundedDiff}) គីឡូ`;
  } else {
    statusMessage = `លើស ${roundedDiff} គីឡូ`;
  }

  return {
    items,
    scaleInKg: sIn,
    scaleOutKg: sOut,
    scaleNetKg,
    warehouseTotalKg,
    diffKg,
    diffPercent,
    tolerancePercent,
    isApproved,
    status,
    statusMessage,
  };
}
