import assert from 'node:assert/strict';
import { parseTownList } from '../src/lib/townContent.ts';

const dashed = parseTownList(`Bedok Reservoir Park – Popular jogging and kayaking spot.
East Coast Park - Coastal cycling and picnic stretch.`);

assert.deepEqual(dashed, [
  { title: 'Bedok Reservoir Park', description: 'Popular jogging and kayaking spot.' },
  { title: 'East Coast Park', description: 'Coastal cycling and picnic stretch.' },
]);

const commaList = parseTownList('Bedok Interchange Hawker Centre, Bedok 85 Fengshan Food Centre');

assert.deepEqual(commaList, [
  { title: 'Bedok Interchange Hawker Centre' },
  { title: 'Bedok 85 Fengshan Food Centre' },
]);

const prose = parseTownList('Bedok has a laid-back charm with older HDB flats and newer developments.');

assert.deepEqual(prose, [
  { description: 'Bedok has a laid-back charm with older HDB flats and newer developments.' },
]);

const commaRichProse = parseTownList(
  'Bedok exudes a laid-back charm with older HDB flats and newer developments, attracting young families and long-time residents.',
);

assert.deepEqual(commaRichProse, [
  {
    description:
      'Bedok exudes a laid-back charm with older HDB flats and newer developments, attracting young families and long-time residents.',
  },
]);

console.log('town content helpers ok');
