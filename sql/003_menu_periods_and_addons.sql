begin;

alter table "MenuItem"
  add column if not exists "itemKind" text not null default 'THALI';

alter table "MenuItem"
  drop constraint if exists "MenuItem_itemKind_check";

alter table "MenuItem"
  add constraint "MenuItem_itemKind_check"
  check ("itemKind" in ('THALI', 'ADD_ON'));

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
  'dinner-chicken-thali', 'dinner-katlaa-macher-thali', 'dinner-egg-thali', 'dinner-veg-thali',
  'addon-roti', 'addon-extra-rice', 'addon-chicken-curry-plate',
  'dinner-addon-roti', 'dinner-addon-extra-rice', 'dinner-addon-chicken-curry-plate'
);

with menu_components("menuItemId", items) as (
  values
    ('dinner-chicken-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Chicken Curry (2 pcs)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-katlaa-macher-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Katla curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-egg-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Egg curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-veg-thali', array['Rice', 'Moong daal', 'Mochar Ghanto (Banana Flower)', 'Dhokar dalna', 'Chutney/aachar', 'Papad', 'Salad']),
    ('addon-roti', array['1 piece']),
    ('addon-extra-rice', array['1 serving']),
    ('addon-chicken-curry-plate', array['Chicken Curry (3 pcs)']),
    ('dinner-addon-roti', array['1 piece']),
    ('dinner-addon-extra-rice', array['1 serving']),
    ('dinner-addon-chicken-curry-plate', array['Chicken Curry (3 pcs)'])
)
insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select "menuItemId" || '-' || position, "menuItemId", "itemName"
from menu_components
cross join lateral unnest(items) with ordinality as component("itemName", position);

commit;
