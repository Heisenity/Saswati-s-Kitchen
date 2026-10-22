do $$
begin
  if not exists (select 1 from pg_type where typname = 'MealType') then
    create type "MealType" as enum ('LUNCH', 'DINNER');
  end if;
end $$;

begin;

alter table "MenuItem"
  add column if not exists "itemKind" text not null default 'THALI';

-- 1. Insert/Update New Thalis (Lunch and Dinner)
insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
values
  -- Tangra Macher Thali
  ('tangra-macher-thali', 'Tangra Macher Thali', 'tangra-macher-thali', 'Rich and aromatic Bengali Tangra macher jhol with two fish pieces, served with rice, dal, and accompaniments.', 200, '/brand/tangra-macher-thali.jpg', 'LUNCH'::"MealType", 'THALI', '2 pcs', true, 20, now(), now()),
  ('dinner-tangra-macher-thali', 'Tangra Macher Thali', 'dinner-tangra-macher-thali', 'Rich and aromatic Bengali Tangra macher jhol with two fish pieces, served with rice, dal, and evening spread.', 200, '/brand/tangra-macher-thali.jpg', 'DINNER'::"MealType", 'THALI', '2 pcs', true, 20, now(), now()),

  -- Bata Macher Thali
  ('bata-macher-thali', 'Bata Macher Thali', 'bata-macher-thali', 'Homestyle Bata macher jhol served with fragrant rice, dal, and accompaniments.', 150, '/brand/bata-macher-thali.jpg', 'LUNCH'::"MealType", 'THALI', 'Bengali Special', true, 20, now(), now()),
  ('dinner-bata-macher-thali', 'Bata Macher Thali', 'dinner-bata-macher-thali', 'Homestyle Bata macher jhol served with fresh Bengali dinner spread.', 150, '/brand/bata-macher-thali.jpg', 'DINNER'::"MealType", 'THALI', 'Bengali Special', true, 20, now(), now()),

  -- Chara Pona Thali
  ('chara-pona-thali', 'Chara Pona Thali', 'chara-pona-thali', 'Authentic Bengali chara pona fish curry served with steamed rice, dal, and homestyle sides.', 140, '/brand/chara-pona-thali.jpg', 'LUNCH'::"MealType", 'THALI', 'Fresh Catch', true, 20, now(), now()),
  ('dinner-chara-pona-thali', 'Chara Pona Thali', 'dinner-chara-pona-thali', 'Authentic Bengali chara pona fish curry served with fresh dinner sides.', 140, '/brand/chara-pona-thali.jpg', 'DINNER'::"MealType", 'THALI', 'Fresh Catch', true, 20, now(), now())
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  "imageUrl" = excluded."imageUrl",
  badge = excluded.badge,
  "isActive" = true,
  "stockLimit" = excluded."stockLimit",
  "updatedAt" = now();

-- Refresh components for new thalis
delete from "MenuItemComponent"
where "menuItemId" in (
  'tangra-macher-thali', 'dinner-tangra-macher-thali',
  'bata-macher-thali', 'dinner-bata-macher-thali',
  'chara-pona-thali', 'dinner-chara-pona-thali'
);

with thali_components("menuItemId", items) as (
  values
    ('tangra-macher-thali', array['Rice', 'Moosor daal', 'Aloo potol kosha', 'Tangra fish curry (2 pcs)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-tangra-macher-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Tangra fish curry (2 pcs)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('bata-macher-thali', array['Rice', 'Moosor daal', 'Aloo potol kosha', 'Bata macher curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-bata-macher-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Bata macher curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('chara-pona-thali', array['Rice', 'Moosor daal', 'Aloo potol kosha', 'Chara Pona fish curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-chara-pona-thali', array['Rice', 'Moosor daal', 'Mochar Ghanto (Banana Flower)', 'Chara Pona fish curry (1 pc)', 'Chutney/aachar', 'Papad', 'Salad'])
)
insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select "menuItemId" || '-' || position, "menuItemId", "itemName"
from thali_components
cross join lateral unnest(items) with ordinality as component("itemName", position)
on conflict (id) do update set "itemName" = excluded."itemName";

-- 2. Insert/Update New Add-ons (Lunch and Dinner)
with new_addon_updates(base_slug, name, description, price, badge, image_path, stock_limit, component) as (
  values
    ('tangra-fish-curry', 'Tangra Fish Curry', 'Homestyle Bengali Tangra fish curry with two tender pieces in rich aromatic gravy.', 100, '2 pcs', '/brand/addons/tangra-fish-curry.jpg', 30, '1 plate · 2 fish pieces'),
    ('chara-pona-fish-curry', 'Chara Pona Fish Curry', 'Fresh chara pona fish cooked in light, comforting homestyle Bengali curry.', 55, '1 pc', '/brand/addons/chara-pona-fish-curry.jpg', 35, '1 plate · 1 fish piece'),
    ('palak-paneer', 'Palak Paneer', 'Soft fresh paneer cubes cooked in a spiced, vibrant spinach gravy.', 140, '1 plate', '/brand/addons/palak-paneer.jpg', 25, '1 plate'),
    ('vendi-masala', 'Vendi Masala', 'Fresh tender okra cooked in a savoury homestyle tomato and onion masala.', 55, '1 plate', '/brand/addons/vendi-masala.jpg', 35, '1 plate'),
    ('aloo-fulkofi-curry', 'Aloo Fulkofi Curry', 'Classic Bengali aloo fulkopi curry with tender cauliflower and potatoes in mild warm spices.', 50, '1 plate', '/brand/addons/aloo-fulkofi-curry.jpg', 35, '1 plate'),
    ('potol-dorma-4pcs', 'Potol Dorma', 'Traditional Bengali potol dorma—delicately stuffed pointed gourds simmered in velvety gravy (4 pcs).', 45, '4 pcs', '/brand/addons/potol-dorma.jpg', 30, '1 plate · 4 pieces'),
    ('musur-dal', 'Musur Dal', 'Comforting homestyle Bengali musur dal tempered with cumin, turmeric and green chilli.', 35, '1 plate', '/brand/addons/musur-dal.jpg', 40, '1 plate')
), expanded as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as id,
    name,
    description,
    price,
    badge,
    image_path,
    meal_type,
    stock_limit,
    component
  from new_addon_updates
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
)
insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
select id, name, id, description, price, image_path, meal_type::"MealType", 'ADD_ON', badge, true, stock_limit, now(), now()
from expanded
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  "imageUrl" = excluded."imageUrl",
  "mealType" = excluded."mealType",
  "itemKind" = excluded."itemKind",
  badge = excluded.badge,
  "isActive" = true,
  "stockLimit" = excluded."stockLimit",
  "updatedAt" = now();

-- Refresh component links for new add-ons
with new_addon_components as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as target_id,
    component
  from (
    values
      ('tangra-fish-curry', '1 plate · 2 fish pieces'),
      ('chara-pona-fish-curry', '1 plate · 1 fish piece'),
      ('palak-paneer', '1 plate'),
      ('vendi-masala', '1 plate'),
      ('aloo-fulkofi-curry', '1 plate'),
      ('potol-dorma-4pcs', '1 plate · 4 pieces'),
      ('musur-dal', '1 plate')
  ) as base_data(base_slug, component)
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
)
delete from "MenuItemComponent"
where "menuItemId" in (select target_id from new_addon_components);

with new_addon_components as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as target_id,
    component
  from (
    values
      ('tangra-fish-curry', '1 plate · 2 fish pieces'),
      ('chara-pona-fish-curry', '1 plate · 1 fish piece'),
      ('palak-paneer', '1 plate'),
      ('vendi-masala', '1 plate'),
      ('aloo-fulkofi-curry', '1 plate'),
      ('potol-dorma-4pcs', '1 plate · 4 pieces'),
      ('musur-dal', '1 plate')
  ) as base_data(base_slug, component)
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
)
insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select
  target_id || '-comp-0',
  target_id,
  component
from new_addon_components
on conflict (id) do update set "itemName" = excluded."itemName";

commit;
