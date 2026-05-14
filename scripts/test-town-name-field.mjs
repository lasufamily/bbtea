import assert from 'node:assert/strict';

const { getAirtableTownName } = await import('../src/lib/airtable.ts');

assert.equal(
  getAirtableTownName({ 'Town Name': 'Tampines' }),
  'Tampines',
  'Town records should resolve names from the Airtable "Town Name" field'
);

assert.equal(
  getAirtableTownName({ Name: 'Orchard' }),
  'Orchard',
  'Town records should continue resolving names from the legacy "Name" field'
);
