-- Retire beverages from the public catalog while preserving product and order history.
UPDATE products
SET active = 0
WHERE slug IN (
  'affogato',
  'bicerin',
  'caffe-corretto',
  'caffe-freddo',
  'caffe-latte',
  'espresso',
  'lungo',
  'macchiato',
  'marocchino',
  'ristretto',
  'shakerato'
);
