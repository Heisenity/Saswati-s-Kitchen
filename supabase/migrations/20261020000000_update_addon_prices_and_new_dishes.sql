do $$
begin
  if not exists (select 1 from pg_type where typname = 'MealType') then
    create type "MealType" as enum ('LUNCH', 'DINNER');
  end if;
end $$;

begin;

alter table "MenuItem"
  add column if not exists "itemKind" text not null default 'THALI';

-- Update existing addon prices, description, badge, and rename Soyabean Curry to Soyabean Kosha
with addon_updates(base_slug, name, description, price, badge, image_path, stock_limit, component) as (
  values
    -- 1. Mutton items
    ('mutton-kosha-3pcs', 'Mutton Kosha', 'Slow-cooked Bengali mutton kosha with three tender mutton pieces in a thick, rich gravy.', 320, '3 pcs', '/brand/addons/mutton-kosha-3pcs.jpg', 25, '1 plate · 3 mutton pieces'),
    ('mutton-kosha-2pcs', 'Mutton Kosha', 'Slow-cooked Bengali mutton kosha with two tender mutton pieces in a thick, rich gravy.', 299, '2 pcs', '/brand/addons/mutton-kosha-2pcs.jpg', 25, '1 plate · 2 mutton pieces'),
    -- 2. Chicken items
    ('chicken-curry-plate', 'Chicken Curry', 'Homestyle chicken curry with three pieces.', 100, '3 pcs', '/brand/addons/chicken-curry.jpg', 30, '1 plate · 3 chicken pieces'),
    ('chicken-tarka', 'Chicken Tarka', 'A hearty bowl of tarka dal with tender chicken pieces.', 100, '1 plate', '/brand/addons/chicken-tarka.jpg', 25, '1 plate'),
    -- 3. Fish items
    ('katla-fish-curry', 'Katla Fish Curry', 'Bengali katla curry with one generous fish piece.', 75, '1 pc', '/brand/addons/katla-fish-curry.jpg', 30, '1 plate · 1 fish piece'),
    ('rui-fish-curry', 'Rui Fish Curry', 'Classic rui curry with one comforting fish piece.', 55, '1 pc', '/brand/addons/rui-fish-curry.jpg', 35, '1 plate · 1 fish piece'),
    -- 4. Fried Rice items
    ('chicken-fried-rice', 'Chicken Fried Rice', 'Aromatic fried rice loaded with seasoned shredded chicken, egg and gentle homestyle spices.', 125, '1 plate', '/brand/addons/chicken-fried-rice.jpg', 25, '1 plate'),
    ('veg-fried-rice', 'Veg Fried Rice', 'Fluffy, fragrant Bengali style veg fried rice tossed with carrots, beans, cashews and gentle whole spices.', 90, '1 plate', '/brand/addons/veg-fried-rice.jpg', 30, '1 plate'),
    -- 5. Other items (High to Low price)
    ('paneer-butter-masala', 'Paneer Butter Masala', 'Rich, creamy paneer butter masala for a fuller meal.', 100, '1 plate', '/brand/addons/paneer-butter-masala.jpg', 25, '1 plate'),
    ('milk-sewai', 'Milk Sewai', 'Creamy milk sewai with a gentle cardamom sweetness.', 80, '1 plate', '/brand/addons/milk-sewai.jpg', 30, '1 plate'),
    ('mixed-vegetables', 'Mixed Vegetables', 'A colourful homestyle mix of seasonal vegetables.', 70, '1 plate', '/brand/addons/mixed-vegetables.jpg', 35, '1 plate'),
    ('paneer-curry', 'Paneer Curry', 'Soft paneer in a light, comforting homestyle curry.', 70, '1 plate', '/brand/addons/paneer-curry.jpg', 30, '1 plate'),
    ('egg-tarka', 'Egg Tarka', 'Comforting tarka dal enriched with freshly cooked egg.', 65, '1 plate', '/brand/addons/egg-tarka.jpg', 35, '1 plate'),
    ('chana-masala', 'Chana Masala', 'Slow-cooked chickpeas in a rich, homestyle masala.', 60, '1 plate', '/brand/addons/chana-masala.jpg', 40, '1 plate'),
    ('plain-tarka', 'Plain Tarka', 'Creamy dhaba-style tarka dal with garlic and green chilli.', 55, '1 plate', '/brand/addons/plain-tarka.jpg', 35, '1 plate'),
    ('egg-curry', 'Egg Curry', 'Homestyle Bengali egg curry with two eggs.', 55, '2 pcs', '/brand/addons/egg-curry.jpg', 40, '1 plate · 2 eggs'),
    ('dhokar-dalna-2pcs', 'Dhokar Dalna', 'Bengali dhokar dalna with two golden lentil cakes.', 50, '2 pcs', '/brand/addons/dhokar-dalna-2pcs.jpg', 35, '1 plate · 2 pieces'),
    ('egg-bhurji', 'Egg Bhurji', 'Fresh egg bhurji prepared with two eggs.', 50, '2 dimer', '/brand/addons/egg-bhurji.jpg', 40, '1 plate · 2 eggs'),
    ('aloo-dum', 'Aloo Dum', 'Bengali aloo dum with four tender potato pieces.', 45, '4 pcs', '/brand/addons/aloo-dum.jpg', 35, '1 plate · 4 potato pieces'),
    ('soyabean-curry', 'Soyabean Kosha', 'Homestyle soyabean kosha with warm Bengali spices.', 45, '1 plate', '/brand/addons/soyabean-curry.jpg', 40, '1 plate'),
    ('dhokar-dalna-1pc', 'Dhokar Dalna', 'Bengali dhokar dalna with one golden lentil cake.', 35, '1 pc', '/brand/addons/dhokar-dalna-1pc.jpg', 35, '1 plate · 1 piece'),
    ('cholar-dal', 'Cholar Dal', 'A comforting plate of lightly spiced Bengali cholar dal.', 30, '1 plate', '/brand/addons/cholar-dal.jpg', 40, '1 plate'),
    ('boiled-egg-2pcs', 'Boiled Egg', 'Two freshly boiled farm eggs served with a pinch of rock salt and black pepper.', 30, '2 pcs', '/brand/addons/boiled-egg-2pcs.jpg', 50, '2 boiled eggs'),
    ('extra-rice', 'Extra Rice', 'One extra plate of fluffy steamed rice.', 25, '1 plate', '/brand/addons/extra-rice.jpg', 60, '1 plate'),
    ('aloo-bhaja', 'Aloo Bhaja', 'Crisp, golden Bengali-style fried potato strips.', 25, '1 plate', '/brand/addons/aloo-bhaja.jpg', 40, '1 plate'),
    ('bhindi-bhaja', 'Bhindi Bhaja', 'Lightly spiced, dry-fried okra with homestyle flavour.', 25, '1 plate', '/brand/addons/bhindi-bhaja.jpg', 35, '1 plate'),
    ('butter-roti', 'Butter Roti', 'One warm roti finished with a light touch of butter.', 15, '1 pc', '/brand/addons/butter-roti.jpg', 100, '1 piece'),
    ('egg-omelette', 'Egg Omelette', 'A freshly cooked, lightly seasoned one-egg omelette.', 15, '1 pc', '/brand/addons/egg-omelette.jpg', 50, '1 egg omelette'),
    ('boiled-egg-1pc', 'Boiled Egg', 'One freshly boiled farm egg served with a pinch of rock salt and black pepper.', 15, '1 pc', '/brand/addons/boiled-egg-1pc.jpg', 50, '1 boiled egg'),
    ('roti', 'Roti', 'One fresh, soft roti—perfect with any curry.', 7, '1 pc', '/brand/addons/roti.jpg', 100, '1 piece')
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
  from addon_updates
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

-- Refresh component links for expanded items
with addon_components as (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as target_id,
    component
  from (
    values
      ('mutton-kosha-3pcs', '1 plate · 3 mutton pieces'),
      ('mutton-kosha-2pcs', '1 plate · 2 mutton pieces'),
      ('chicken-curry-plate', '1 plate · 3 chicken pieces'),
      ('chicken-tarka', '1 plate'),
      ('katla-fish-curry', '1 plate · 1 fish piece'),
      ('rui-fish-curry', '1 plate · 1 fish piece'),
      ('chicken-fried-rice', '1 plate'),
      ('veg-fried-rice', '1 plate'),
      ('paneer-butter-masala', '1 plate'),
      ('milk-sewai', '1 plate'),
      ('mixed-vegetables', '1 plate'),
      ('paneer-curry', '1 plate'),
      ('egg-tarka', '1 plate'),
      ('chana-masala', '1 plate'),
      ('plain-tarka', '1 plate'),
      ('egg-curry', '1 plate · 2 eggs'),
      ('dhokar-dalna-2pcs', '1 plate · 2 pieces'),
      ('egg-bhurji', '1 plate · 2 eggs'),
      ('aloo-dum', '1 plate · 4 potato pieces'),
      ('soyabean-curry', '1 plate'),
      ('dhokar-dalna-1pc', '1 plate · 1 piece'),
      ('cholar-dal', '1 plate'),
      ('boiled-egg-2pcs', '2 boiled eggs'),
      ('extra-rice', '1 plate'),
      ('aloo-bhaja', '1 plate'),
      ('bhindi-bhaja', '1 plate'),
      ('butter-roti', '1 piece'),
      ('egg-omelette', '1 egg omelette'),
      ('boiled-egg-1pc', '1 boiled egg'),
      ('roti', '1 piece')
  ) as base_data(base_slug, component)
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
)
delete from "MenuItemComponent"
where "menuItemId" in (select target_id from addon_components);

insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select
  target_id || '-comp-0',
  target_id,
  component
from (
  select
    case when meal_type = 'DINNER' then 'dinner-addon-' || base_slug else 'addon-' || base_slug end as target_id,
    component
  from (
    values
      ('mutton-kosha-3pcs', '1 plate · 3 mutton pieces'),
      ('mutton-kosha-2pcs', '1 plate · 2 mutton pieces'),
      ('chicken-curry-plate', '1 plate · 3 chicken pieces'),
      ('chicken-tarka', '1 plate'),
      ('katla-fish-curry', '1 plate · 1 fish piece'),
      ('rui-fish-curry', '1 plate · 1 fish piece'),
      ('chicken-fried-rice', '1 plate'),
      ('veg-fried-rice', '1 plate'),
      ('paneer-butter-masala', '1 plate'),
      ('milk-sewai', '1 plate'),
      ('mixed-vegetables', '1 plate'),
      ('paneer-curry', '1 plate'),
      ('egg-tarka', '1 plate'),
      ('chana-masala', '1 plate'),
      ('plain-tarka', '1 plate'),
      ('egg-curry', '1 plate · 2 eggs'),
      ('dhokar-dalna-2pcs', '1 plate · 2 pieces'),
      ('egg-bhurji', '1 plate · 2 eggs'),
      ('aloo-dum', '1 plate · 4 potato pieces'),
      ('soyabean-curry', '1 plate'),
      ('dhokar-dalna-1pc', '1 plate · 1 piece'),
      ('cholar-dal', '1 plate'),
      ('boiled-egg-2pcs', '2 boiled eggs'),
      ('extra-rice', '1 plate'),
      ('aloo-bhaja', '1 plate'),
      ('bhindi-bhaja', '1 plate'),
      ('butter-roti', '1 piece'),
      ('egg-omelette', '1 egg omelette'),
      ('boiled-egg-1pc', '1 boiled egg'),
      ('roti', '1 piece')
  ) as base_data(base_slug, component)
  cross join (values ('LUNCH'), ('DINNER')) as meals(meal_type)
) as final_data
on conflict (id) do update set "itemName" = excluded."itemName";

commit;
