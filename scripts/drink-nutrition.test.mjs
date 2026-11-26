import test from 'node:test';
import assert from 'node:assert/strict';
import * as airtable from '../src/lib/airtable.ts';

const record = fields => ({ id: 'drink', createdTime: '2026-11-27', fields: {
  'Drink Name': 'Sample tea', Slug: 'sample-tea', ...fields,
} });

test('drink mapping preserves recorded calories, grades and certification details', () => {
  assert.equal(typeof airtable.mapDrink, 'function');
  const drink = airtable.mapDrink(record({
    'Calories per 100ml (kcal)': '30',
    'Calories per M cup (kcal)': '144',
    'Calories per L cup (kcal)': '210',
    'Nutri-Grade': ' B ',
    'Healthier Choice': true,
    'Healthier Choice Type': 'Lower in sugar',
  }), new Map());
  assert.equal(drink.caloriesPer100ml, '30');
  assert.equal(drink.caloriesM, '144');
  assert.equal(drink.caloriesL, '210');
  assert.equal(drink.nutriGrade, 'B');
  assert.equal(drink.healthierChoice, true);
  assert.equal(drink.healthierChoiceType, 'Lower in sugar');
});

test('drink mapping preserves zero and legacy calories without inventing missing nutrition', () => {
  assert.equal(typeof airtable.mapDrink, 'function');
  const zero = airtable.mapDrink(record({'Calories per M cup (kcal)': '0'}), new Map());
  assert.equal(zero.caloriesM, '0');
  assert.equal(zero.calories, '0');
  assert.equal(zero.caloriesL, undefined);
  assert.equal(zero.nutriGrade, undefined);
  assert.equal(zero.healthierChoice, false);
  assert.equal(zero.healthierChoiceType, undefined);
  const legacy = airtable.mapDrink(record({'Calories (kcal)': '120'}), new Map());
  assert.equal(legacy.calories, '120');
  assert.equal(legacy.caloriesM, undefined);
});
