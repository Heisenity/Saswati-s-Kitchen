begin;

insert into "Setting" (
  id,
  "kitchenLatitude",
  "kitchenLongitude",
  "lunchCloseTime",
  "dinnerOpenTime",
  "dinnerCloseTime",
  "freeDeliveryOneKmMin",
  "freeDeliveryTwoKmMin",
  "aboveTwoKmDeliveryCharge",
  "lowOrderDeliveryCharge",
  "upiId",
  "qrImageUrl",
  "createdAt",
  "updatedAt"
)
values (
  'default-setting',
  22.757527,
  88.380229,
  '09:00',
  '09:30',
  '18:00',
  99,
  139,
  29,
  19,
  'saswatiskitchen@upi',
  '/brand/upi-qr.jpg',
  now(),
  now()
)
on conflict (id) do update set
  "kitchenLatitude" = excluded."kitchenLatitude",
  "kitchenLongitude" = excluded."kitchenLongitude",
  "lunchCloseTime" = excluded."lunchCloseTime",
  "dinnerOpenTime" = excluded."dinnerOpenTime",
  "dinnerCloseTime" = excluded."dinnerCloseTime",
  "freeDeliveryOneKmMin" = excluded."freeDeliveryOneKmMin",
  "freeDeliveryTwoKmMin" = excluded."freeDeliveryTwoKmMin",
  "aboveTwoKmDeliveryCharge" = excluded."aboveTwoKmDeliveryCharge",
  "lowOrderDeliveryCharge" = excluded."lowOrderDeliveryCharge",
  "upiId" = excluded."upiId",
  "qrImageUrl" = excluded."qrImageUrl",
  "updatedAt" = now();

insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
values
  ('mutton-thali', 'Mutton Thali', 'mutton-thali', 'Rich Bengali mutton kosha for a special lunch.', 249, '/brand/mutton-thali.jpg', 'LUNCH', 'Premium', true, 18, now(), now()),
  ('chingri-thali', 'Chingri Thali', 'chingri-thali', 'Light, flavorful and comforting prawn meal.', 159, '/brand/chingri-thali.jpg', 'LUNCH', 'Chef''s Pick', true, 20, now(), now()),
  ('pabda-thali', 'Pabda Thali', 'pabda-thali', 'Authentic Bengali sorshe pabda taste.', 159, '/brand/pabda-thali.jpg', 'LUNCH', 'Traditional Favorite', true, 16, now(), now()),
  ('chicken-thali', 'Chicken Thali', 'chicken-thali', 'Everyday comfort with homestyle chicken curry.', 149, '/brand/chicken-thali.jpg', 'LUNCH', 'Most Loved', true, 24, now(), now()),
  ('katlaa-macher-thali', 'Katlaa Macher Thali', 'katlaa-macher-thali', 'Balanced Bengali fish thali at a great price.', 139, '/brand/katlaa-thali.jpg', 'LUNCH', 'Value Choice', true, 22, now(), now()),
  ('rui-macher-thali', 'Rui Macher Thali', 'rui-macher-thali', 'Classic rui macher kalia, perfect for regular lunch.', 119, '/brand/rui-thali.jpg', 'LUNCH', 'Best Seller', true, 30, now(), now()),
  ('egg-thali', 'Egg Thali', 'egg-thali', 'Simple, filling and affordable home-style meal.', 99, '/brand/egg-thali.jpg', 'LUNCH', 'Budget Favorite', true, 25, now(), now()),
  ('veg-thali', 'Veg Thali', 'veg-thali', 'Fresh vegetarian Bengali meal for everyday eating.', 89, '/brand/veg-thali.jpg', 'LUNCH', 'Light & Comforting', true, 26, now(), now())
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  "imageUrl" = excluded."imageUrl",
  "mealType" = excluded."mealType",
  badge = excluded.badge,
  "isActive" = excluded."isActive",
  "stockLimit" = excluded."stockLimit",
  "updatedAt" = now();

delete from "MenuItemComponent"
where "menuItemId" in (
  'mutton-thali',
  'chingri-thali',
  'pabda-thali',
  'chicken-thali',
  'katlaa-macher-thali',
  'rui-macher-thali',
  'egg-thali',
  'veg-thali'
);

insert into "MenuItemComponent" (id, "menuItemId", "itemName")
values
  ('mutton-thali-1', 'mutton-thali', 'Rice'),
  ('mutton-thali-2', 'mutton-thali', 'Moosor daal'),
  ('mutton-thali-3', 'mutton-thali', 'Aloo potol kosha'),
  ('mutton-thali-4', 'mutton-thali', 'Mutton Kosha'),
  ('mutton-thali-5', 'mutton-thali', 'Chutney/aachar'),
  ('mutton-thali-6', 'mutton-thali', 'Papad'),
  ('mutton-thali-7', 'mutton-thali', 'Salad'),
  ('chingri-thali-1', 'chingri-thali', 'Rice'),
  ('chingri-thali-2', 'chingri-thali', 'Moosor daal'),
  ('chingri-thali-3', 'chingri-thali', 'Aloo potol kosha'),
  ('chingri-thali-4', 'chingri-thali', 'Chingri bhaapa'),
  ('chingri-thali-5', 'chingri-thali', 'Chutney/aachar'),
  ('chingri-thali-6', 'chingri-thali', 'Papad'),
  ('chingri-thali-7', 'chingri-thali', 'Salad'),
  ('pabda-thali-1', 'pabda-thali', 'Rice'),
  ('pabda-thali-2', 'pabda-thali', 'Moosor daal'),
  ('pabda-thali-3', 'pabda-thali', 'Aloo potol kosha'),
  ('pabda-thali-4', 'pabda-thali', 'Sorshe Pabda'),
  ('pabda-thali-5', 'pabda-thali', 'Chutney/aachar'),
  ('pabda-thali-6', 'pabda-thali', 'Papad'),
  ('pabda-thali-7', 'pabda-thali', 'Salad'),
  ('chicken-thali-1', 'chicken-thali', 'Rice'),
  ('chicken-thali-2', 'chicken-thali', 'Moosor daal'),
  ('chicken-thali-3', 'chicken-thali', 'Aloo potol kosha'),
  ('chicken-thali-4', 'chicken-thali', 'Chicken Curry'),
  ('chicken-thali-5', 'chicken-thali', 'Chutney/aachar'),
  ('chicken-thali-6', 'chicken-thali', 'Papad'),
  ('chicken-thali-7', 'chicken-thali', 'Salad'),
  ('katlaa-macher-thali-1', 'katlaa-macher-thali', 'Rice'),
  ('katlaa-macher-thali-2', 'katlaa-macher-thali', 'Moosor daal'),
  ('katlaa-macher-thali-3', 'katlaa-macher-thali', 'Aloo potol kosha'),
  ('katlaa-macher-thali-4', 'katlaa-macher-thali', 'Katla curry'),
  ('katlaa-macher-thali-5', 'katlaa-macher-thali', 'Chutney/aachar'),
  ('katlaa-macher-thali-6', 'katlaa-macher-thali', 'Papad'),
  ('katlaa-macher-thali-7', 'katlaa-macher-thali', 'Salad'),
  ('rui-macher-thali-1', 'rui-macher-thali', 'Rice'),
  ('rui-macher-thali-2', 'rui-macher-thali', 'Moosor daal'),
  ('rui-macher-thali-3', 'rui-macher-thali', 'Aloo potol kosha'),
  ('rui-macher-thali-4', 'rui-macher-thali', 'Rui macher kalia'),
  ('rui-macher-thali-5', 'rui-macher-thali', 'Chutney/aachar'),
  ('rui-macher-thali-6', 'rui-macher-thali', 'Papad'),
  ('rui-macher-thali-7', 'rui-macher-thali', 'Salad'),
  ('egg-thali-1', 'egg-thali', 'Rice'),
  ('egg-thali-2', 'egg-thali', 'Moosor daal'),
  ('egg-thali-3', 'egg-thali', 'Aloo potol kosha'),
  ('egg-thali-4', 'egg-thali', 'Egg curry'),
  ('egg-thali-5', 'egg-thali', 'Chutney/aachar'),
  ('egg-thali-6', 'egg-thali', 'Papad'),
  ('egg-thali-7', 'egg-thali', 'Salad'),
  ('veg-thali-1', 'veg-thali', 'Rice'),
  ('veg-thali-2', 'veg-thali', 'Moosor daal'),
  ('veg-thali-3', 'veg-thali', 'Aloo potol kosha'),
  ('veg-thali-4', 'veg-thali', 'Dhokar dalna / Paneer Curry'),
  ('veg-thali-5', 'veg-thali', 'Chutney/aachar'),
  ('veg-thali-6', 'veg-thali', 'Papad'),
  ('veg-thali-7', 'veg-thali', 'Salad');

insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
values
  ('dinner-chicken-thali', 'Chicken Thali', 'dinner-chicken-thali', 'Homestyle chicken curry with a comforting Bengali dinner spread.', 149, '/brand/chicken-thali.jpg', 'DINNER', 'THALI', 'Dinner Favourite', true, 24, now(), now()),
  ('dinner-katlaa-macher-thali', 'Katlaa Macher Thali', 'dinner-katlaa-macher-thali', 'Classic Katla curry served with a fresh Bengali dinner spread.', 139, '/brand/katlaa-thali.jpg', 'DINNER', 'THALI', 'Bengali Classic', true, 22, now(), now()),
  ('dinner-egg-thali', 'Egg Thali', 'dinner-egg-thali', 'Simple egg curry and Bengali sides for a filling dinner.', 99, '/brand/egg-thali.jpg', 'DINNER', 'THALI', 'Budget Favourite', true, 25, now(), now()),
  ('dinner-veg-thali', 'Veg Thali', 'dinner-veg-thali', 'Light vegetarian Bengali dinner with dhokar dalna.', 89, '/brand/veg-thali.jpg', 'DINNER', 'THALI', 'Veg Comfort', true, 26, now(), now()),
  ('addon-roti', 'Roti', 'addon-roti', 'Fresh soft roti to add to any meal.', 5, '/brand/veg-thali.jpg', 'LUNCH', 'ADD_ON', 'Add-on', true, 100, now(), now()),
  ('addon-extra-rice', 'Extra Rice', 'addon-extra-rice', 'An extra serving of steamed rice.', 20, '/brand/veg-thali.jpg', 'LUNCH', 'ADD_ON', 'Add-on', true, 60, now(), now()),
  ('addon-chicken-curry-plate', 'Chicken Curry Plate', 'addon-chicken-curry-plate', 'Homestyle Bengali chicken curry plate.', 80, '/brand/chicken-thali.jpg', 'LUNCH', 'ADD_ON', 'Add-on', true, 30, now(), now()),
  ('dinner-addon-roti', 'Roti', 'dinner-addon-roti', 'Fresh soft roti to add to any meal.', 5, '/brand/veg-thali.jpg', 'DINNER', 'ADD_ON', 'Add-on', true, 100, now(), now()),
  ('dinner-addon-extra-rice', 'Extra Rice', 'dinner-addon-extra-rice', 'An extra serving of steamed rice.', 20, '/brand/veg-thali.jpg', 'DINNER', 'ADD_ON', 'Add-on', true, 60, now(), now()),
  ('dinner-addon-chicken-curry-plate', 'Chicken Curry Plate', 'dinner-addon-chicken-curry-plate', 'Homestyle Bengali chicken curry plate.', 80, '/brand/chicken-thali.jpg', 'DINNER', 'ADD_ON', 'Add-on', true, 30, now(), now())
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  "imageUrl" = excluded."imageUrl",
  "mealType" = excluded."mealType",
  "itemKind" = excluded."itemKind",
  badge = excluded.badge,
  "isActive" = excluded."isActive",
  "stockLimit" = excluded."stockLimit",
  "updatedAt" = now();

delete from "MenuItemComponent"
where "menuItemId" in (
  'dinner-chicken-thali',
  'dinner-katlaa-macher-thali',
  'dinner-egg-thali',
  'dinner-veg-thali',
  'addon-roti',
  'addon-extra-rice',
  'addon-chicken-curry-plate',
  'dinner-addon-roti',
  'dinner-addon-extra-rice',
  'dinner-addon-chicken-curry-plate'
);

insert into "MenuItemComponent" (id, "menuItemId", "itemName")
values
  ('dinner-chicken-thali-1', 'dinner-chicken-thali', 'Rice'),
  ('dinner-chicken-thali-2', 'dinner-chicken-thali', 'Moosor daal'),
  ('dinner-chicken-thali-3', 'dinner-chicken-thali', 'Mochar Ghanto (Banana Flower)'),
  ('dinner-chicken-thali-4', 'dinner-chicken-thali', 'Chicken Curry (2 pcs)'),
  ('dinner-chicken-thali-5', 'dinner-chicken-thali', 'Chutney/aachar'),
  ('dinner-chicken-thali-6', 'dinner-chicken-thali', 'Papad'),
  ('dinner-chicken-thali-7', 'dinner-chicken-thali', 'Salad'),
  ('dinner-katlaa-macher-thali-1', 'dinner-katlaa-macher-thali', 'Rice'),
  ('dinner-katlaa-macher-thali-2', 'dinner-katlaa-macher-thali', 'Moosor daal'),
  ('dinner-katlaa-macher-thali-3', 'dinner-katlaa-macher-thali', 'Mochar Ghanto (Banana Flower)'),
  ('dinner-katlaa-macher-thali-4', 'dinner-katlaa-macher-thali', 'Katla curry (1 pc)'),
  ('dinner-katlaa-macher-thali-5', 'dinner-katlaa-macher-thali', 'Chutney/aachar'),
  ('dinner-katlaa-macher-thali-6', 'dinner-katlaa-macher-thali', 'Papad'),
  ('dinner-katlaa-macher-thali-7', 'dinner-katlaa-macher-thali', 'Salad'),
  ('dinner-egg-thali-1', 'dinner-egg-thali', 'Rice'),
  ('dinner-egg-thali-2', 'dinner-egg-thali', 'Moosor daal'),
  ('dinner-egg-thali-3', 'dinner-egg-thali', 'Mochar Ghanto (Banana Flower)'),
  ('dinner-egg-thali-4', 'dinner-egg-thali', 'Egg curry (1 pc)'),
  ('dinner-egg-thali-5', 'dinner-egg-thali', 'Chutney/aachar'),
  ('dinner-egg-thali-6', 'dinner-egg-thali', 'Papad'),
  ('dinner-egg-thali-7', 'dinner-egg-thali', 'Salad'),
  ('dinner-veg-thali-1', 'dinner-veg-thali', 'Rice'),
  ('dinner-veg-thali-2', 'dinner-veg-thali', 'Moong daal'),
  ('dinner-veg-thali-3', 'dinner-veg-thali', 'Mochar Ghanto (Banana Flower)'),
  ('dinner-veg-thali-4', 'dinner-veg-thali', 'Dhokar dalna'),
  ('dinner-veg-thali-5', 'dinner-veg-thali', 'Chutney/aachar'),
  ('dinner-veg-thali-6', 'dinner-veg-thali', 'Papad'),
  ('dinner-veg-thali-7', 'dinner-veg-thali', 'Salad'),
  ('addon-roti-1', 'addon-roti', '1 piece'),
  ('addon-extra-rice-1', 'addon-extra-rice', '1 serving'),
  ('addon-chicken-curry-plate-1', 'addon-chicken-curry-plate', 'Chicken Curry (3 pcs)'),
  ('dinner-addon-roti-1', 'dinner-addon-roti', '1 piece'),
  ('dinner-addon-extra-rice-1', 'dinner-addon-extra-rice', '1 serving'),
  ('dinner-addon-chicken-curry-plate-1', 'dinner-addon-chicken-curry-plate', 'Chicken Curry (3 pcs)');

commit;
