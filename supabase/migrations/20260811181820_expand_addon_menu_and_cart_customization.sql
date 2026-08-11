begin;

alter table "OrderItem"
  add column if not exists customization text;

update "MenuItem"
set "imageUrl" = '/brand/veg-thali-v2.jpg', "updatedAt" = now()
where slug in ('veg-thali', 'dinner-veg-thali');

update "MenuItem"
set "isActive" = false, "updatedAt" = now()
where slug in ('addon-butter-parantha', 'dinner-addon-butter-parantha');

with addon_data(base_slug, name, description, price, badge, image_path, stock_limit, component) as (
  values
    ('roti', 'Roti', 'One fresh, soft roti—perfect with any curry.', 5, '1 pc', '/brand/addons/roti.jpg', 100, '1 piece'),
    ('butter-roti', 'Butter Roti', 'One warm roti finished with a light touch of butter.', 10, '1 pc', '/brand/addons/butter-roti.jpg', 100, '1 piece'),
    ('extra-rice', 'Extra Rice', 'One extra plate of fluffy steamed rice.', 20, '1 plate', '/brand/addons/extra-rice.jpg', 60, '1 plate'),
    ('egg-curry', 'Egg Curry', 'Homestyle Bengali egg curry with two eggs.', 40, '2 pcs', '/brand/addons/egg-curry.jpg', 40, '1 plate · 2 eggs'),
    ('katla-fish-curry', 'Katla Fish Curry', 'Bengali katla curry with one generous fish piece.', 60, '1 pc', '/brand/addons/katla-fish-curry.jpg', 30, '1 plate · 1 fish piece'),
    ('rui-fish-curry', 'Rui Fish Curry', 'Classic rui curry with one comforting fish piece.', 40, '1 pc', '/brand/addons/rui-fish-curry.jpg', 35, '1 plate · 1 fish piece'),
    ('chicken-curry-plate', 'Chicken Curry', 'Homestyle chicken curry with four pieces.', 90, '4 pcs', '/brand/addons/chicken-curry.jpg', 30, '1 plate · 4 chicken pieces'),
    ('cholar-dal', 'Cholar Dal', 'A comforting plate of lightly spiced Bengali cholar dal.', 30, '1 plate', '/brand/addons/cholar-dal.jpg', 40, '1 plate'),
    ('aloo-dum', 'Aloo Dum', 'Bengali aloo dum with four tender potato pieces.', 40, '4 pcs', '/brand/addons/aloo-dum.jpg', 35, '1 plate · 4 potato pieces'),
    ('aloo-bhaja', 'Aloo Bhaja', 'Crisp, golden Bengali-style fried potato strips.', 25, '1 plate', '/brand/addons/aloo-bhaja.jpg', 40, '1 plate'),
    ('bhindi-bhaja', 'Bhindi Bhaja', 'Lightly spiced, dry-fried okra with homestyle flavour.', 25, '1 plate', '/brand/addons/bhindi-bhaja.jpg', 35, '1 plate'),
    ('mixed-vegetables', 'Mixed Vegetables', 'A colourful homestyle mix of seasonal vegetables.', 50, '1 plate', '/brand/addons/mixed-vegetables.jpg', 35, '1 plate'),
    ('egg-omelette', 'Egg Omelette', 'A freshly cooked, lightly seasoned one-egg omelette.', 15, '1 pc', '/brand/addons/egg-omelette.jpg', 50, '1 egg omelette'),
    ('milk-sewai', 'Milk Sewai', 'Creamy milk sewai with a gentle cardamom sweetness.', 50, '1 plate', '/brand/addons/milk-sewai.jpg', 30, '1 plate'),
    ('egg-bhurji', 'Egg Bhurji', 'Fresh egg bhurji prepared with two eggs.', 40, '2 eggs', '/brand/addons/egg-bhurji.jpg', 40, '1 plate · 2 eggs'),
    ('dhokar-dalna-1pc', 'Dhokar Dalna', 'Bengali dhokar dalna with one golden lentil cake.', 25, '1 pc', '/brand/addons/dhokar-dalna-1pc.jpg', 35, '1 plate · 1 piece'),
    ('dhokar-dalna-2pcs', 'Dhokar Dalna', 'Bengali dhokar dalna with two golden lentil cakes.', 40, '2 pcs', '/brand/addons/dhokar-dalna-2pcs.jpg', 35, '1 plate · 2 pieces'),
    ('paneer-curry', 'Paneer Curry', 'Soft paneer in a light, comforting homestyle curry.', 50, '1 plate', '/brand/addons/paneer-curry.jpg', 30, '1 plate'),
    ('paneer-butter-masala', 'Paneer Butter Masala', 'Rich, creamy paneer butter masala for a fuller meal.', 90, '1 plate', '/brand/addons/paneer-butter-masala.jpg', 25, '1 plate'),
    ('soyabean-curry', 'Soyabean Curry', 'Homestyle soyabean curry with warm Bengali spices.', 30, '1 plate', '/brand/addons/soyabean-curry.jpg', 40, '1 plate'),
    ('plain-tarka', 'Plain Tarka', 'Creamy dhaba-style tarka dal with garlic and green chilli.', 50, '1 plate', '/brand/addons/plain-tarka.jpg', 35, '1 plate'),
    ('egg-tarka', 'Egg Tarka', 'Comforting tarka dal enriched with freshly cooked egg.', 60, '1 plate', '/brand/addons/egg-tarka.jpg', 35, '1 plate'),
    ('chicken-tarka', 'Chicken Tarka', 'A hearty bowl of tarka dal with tender chicken pieces.', 100, '1 plate', '/brand/addons/chicken-tarka.jpg', 25, '1 plate'),
    ('chana-masala', 'Chana Masala', 'Slow-cooked chickpeas in a rich, homestyle masala.', 50, '1 plate', '/brand/addons/chana-masala.jpg', 40, '1 plate')
), expanded as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as id,
    name,
    description,
    price,
    badge,
    image_path,
    meal_type,
    stock_limit
  from addon_data
  cross join (values ('LUNCH'::"MealType"), ('DINNER'::"MealType")) as meals(meal_type)
)
insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
select id, name, id, description, price, image_path, meal_type, 'ADD_ON', badge, true, stock_limit, now(), now()
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

with addon_slugs as (
  select case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as slug
  from (
    values ('roti'), ('butter-roti'), ('extra-rice'), ('egg-curry'), ('katla-fish-curry'),
      ('rui-fish-curry'), ('chicken-curry-plate'), ('cholar-dal'), ('aloo-dum'), ('aloo-bhaja'),
      ('bhindi-bhaja'), ('mixed-vegetables'), ('egg-omelette'), ('milk-sewai'), ('egg-bhurji'),
      ('dhokar-dalna-1pc'), ('dhokar-dalna-2pcs'), ('paneer-curry'), ('paneer-butter-masala'),
      ('soyabean-curry'), ('plain-tarka'), ('egg-tarka'), ('chicken-tarka'), ('chana-masala')
  ) as addons(base_slug)
  cross join (values ('LUNCH'::"MealType"), ('DINNER'::"MealType")) as meals(meal_type)
)
delete from "MenuItemComponent"
where "menuItemId" in (
  select menu.id
  from "MenuItem" menu
  join addon_slugs on addon_slugs.slug = menu.slug
);

with addon_components(base_slug, component) as (
  values
    ('roti', '1 piece'), ('butter-roti', '1 piece'), ('extra-rice', '1 plate'),
    ('egg-curry', '1 plate · 2 eggs'), ('katla-fish-curry', '1 plate · 1 fish piece'),
    ('rui-fish-curry', '1 plate · 1 fish piece'), ('chicken-curry-plate', '1 plate · 4 chicken pieces'),
    ('cholar-dal', '1 plate'), ('aloo-dum', '1 plate · 4 potato pieces'), ('aloo-bhaja', '1 plate'),
    ('bhindi-bhaja', '1 plate'), ('mixed-vegetables', '1 plate'), ('egg-omelette', '1 egg omelette'),
    ('milk-sewai', '1 plate'), ('egg-bhurji', '1 plate · 2 eggs'),
    ('dhokar-dalna-1pc', '1 plate · 1 piece'), ('dhokar-dalna-2pcs', '1 plate · 2 pieces'),
    ('paneer-curry', '1 plate'), ('paneer-butter-masala', '1 plate'), ('soyabean-curry', '1 plate'),
    ('plain-tarka', '1 plate'), ('egg-tarka', '1 plate'), ('chicken-tarka', '1 plate'), ('chana-masala', '1 plate')
), expanded as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as menu_item_id,
    component
  from addon_components
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
)
insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select menu.id || '-1', menu.id, expanded.component
from expanded
join "MenuItem" menu on menu.slug = expanded.menu_item_id;

commit;
