update "MenuItem"
set
  "imageUrl" = '/brand/rui-thali.jpg',
  "updatedAt" = now()
where id = 'rui-macher-thali'
  or slug = 'rui-macher-thali';
