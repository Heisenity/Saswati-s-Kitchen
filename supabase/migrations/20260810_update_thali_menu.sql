begin;

update "MenuItemComponent"
set "itemName" = case "menuItemId"
  when 'pabda-thali' then 'Sorshe Pabda (1 pc)'
  when 'katlaa-macher-thali' then 'Katla curry (1 pc)'
  when 'rui-macher-thali' then 'Rui macher kalia (1 pc)'
  when 'egg-thali' then 'Egg curry (1 pc)'
end
where "menuItemId" in ('pabda-thali', 'katlaa-macher-thali', 'rui-macher-thali', 'egg-thali')
  and "itemName" in ('Sorshe Pabda', 'Katla curry', 'Rui macher kalia', 'Egg curry');

update "MenuItem"
set description = 'Light vegetarian Bengali dinner.'
where slug = 'dinner-veg-thali';

insert into "MenuItem" (
  id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
  "isActive", "stockLimit", "createdAt", "updatedAt"
)
values
  ('special-veg-thali', 'Special Veg Thali', 'special-veg-thali', 'Our classic veg thali with paneer curry and dhokar dalna.', 119, '/brand/special-veg-thali.png', 'LUNCH', 'THALI', 'Special Veg', true, 20, now(), now()),
  ('dinner-special-veg-thali', 'Special Veg Thali', 'dinner-special-veg-thali', 'Our classic veg dinner thali with paneer curry and dhokar dalna.', 119, '/brand/special-veg-thali.png', 'DINNER', 'THALI', 'Special Veg', true, 20, now(), now())
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  "imageUrl" = excluded."imageUrl",
  badge = excluded.badge,
  "isActive" = excluded."isActive",
  "stockLimit" = excluded."stockLimit",
  "updatedAt" = now();

delete from "MenuItemComponent"
where "menuItemId" in ('veg-thali', 'special-veg-thali', 'dinner-veg-thali', 'dinner-special-veg-thali');

with menu_components("menuItemId", items) as (
  values
    ('veg-thali', array['Rice', 'Moosor daal', 'Aloo potol kosha', 'Chutney/aachar', 'Papad', 'Salad']),
    ('special-veg-thali', array['Rice', 'Moosor daal', 'Aloo potol kosha', 'Paneer curry/Dhokar dalna', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-veg-thali', array['Rice', 'Moong daal', 'Mochar Ghanto (Banana Flower)', 'Chutney/aachar', 'Papad', 'Salad']),
    ('dinner-special-veg-thali', array['Rice', 'Moong daal', 'Mochar Ghanto (Banana Flower)', 'Paneer curry/Dhokar dalna', 'Chutney/aachar', 'Papad', 'Salad'])
)
insert into "MenuItemComponent" (id, "menuItemId", "itemName")
select "menuItemId" || '-' || position, "menuItemId", "itemName"
from menu_components
cross join lateral unnest(items) with ordinality as component("itemName", position);

commit;
