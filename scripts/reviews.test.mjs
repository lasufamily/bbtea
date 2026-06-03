import test from 'node:test';
import assert from 'node:assert/strict';

import { mapReviewRecord } from '../src/lib/airtable.ts';
import { splitArticleParagraphs } from '../src/lib/reviews.ts';

const baseReviewRecord = {
  id: 'review_1',
  createdTime: '2026-06-03T00:00:00.000Z',
  fields: {
    Slug: 'milk-tea-itea-admiralty-place',
    Article: 'The cup was simple but satisfying.\n\nIt worked best as a quick neighbourhood drink.',
    'Reviewer Name': 'Abu Layl',
    'Photo of Cup': [{ id: 'cup', url: 'https://images.example/cup.jpg', width: 1200, height: 1600 }],
    'Photo of Shop': [{ id: 'shop', url: 'https://images.example/shop.jpg', width: 1200, height: 1600 }],
    'Photo of Receipt': [{ id: 'receipt', url: 'https://images.example/receipt.jpg', width: 1200, height: 1600 }],
  },
};

test('review records require both slug and article', () => {
  const review = mapReviewRecord(baseReviewRecord);

  assert.equal(review?.slug, 'milk-tea-itea-admiralty-place');
  assert.equal(review?.article, baseReviewRecord.fields.Article);
  assert.equal(review?.reviewerName, 'Abu Layl');
  assert.deepEqual(
    review?.photos.map(photo => photo.label),
    ['Cup', 'Shop', 'Receipt'],
  );

  assert.equal(
    mapReviewRecord({
      ...baseReviewRecord,
      fields: { ...baseReviewRecord.fields, Article: '   ' },
    }),
    undefined,
    'Reviews with an empty Article field should not generate pages',
  );

  assert.equal(
    mapReviewRecord({
      ...baseReviewRecord,
      fields: { ...baseReviewRecord.fields, Slug: '   ' },
    }),
    undefined,
    'Reviews with an empty Slug field should not generate pages',
  );
});

test('plain text review articles render as safe paragraphs', () => {
  assert.deepEqual(
    splitArticleParagraphs('First paragraph.\n\nSecond paragraph.\nThird line.'),
    ['First paragraph.', 'Second paragraph.\nThird line.'],
  );

  assert.deepEqual(
    splitArticleParagraphs('  <h2>Not HTML</h2>\n\nPlain text only.  '),
    ['<h2>Not HTML</h2>', 'Plain text only.'],
  );
});
