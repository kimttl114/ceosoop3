// Unsplash Source API를 사용한 정확한 음식 이미지 매핑
// 형식: https://source.unsplash.com/400x400/?keyword
export const unsplashImages: Record<string, string> = {
  // === 한식 (20개) ===
  김치찌개: 'https://source.unsplash.com/400x400/?kimchi,stew,korean-food',
  된장찌개: 'https://source.unsplash.com/400x400/?soybean,stew,korean-soup',
  불고기: 'https://source.unsplash.com/400x400/?bulgogi,korean-bbq,beef',
  삼겹살: 'https://source.unsplash.com/400x400/?pork-belly,korean-bbq,samgyeopsal',
  비빔밥: 'https://source.unsplash.com/400x400/?bibimbap,korean-rice,bowl',
  냉면: 'https://source.unsplash.com/400x400/?cold-noodles,naengmyeon,korean',
  갈비탕: 'https://source.unsplash.com/400x400/?beef-soup,korean-soup,galbitang',
  육개장: 'https://source.unsplash.com/400x400/?spicy-beef-soup,korean-soup',
  순대국: 'https://source.unsplash.com/400x400/?korean-soup,blood-sausage',
  제육볶음: 'https://source.unsplash.com/400x400/?spicy-pork,korean-food,stir-fry',
  김치볶음밥: 'https://source.unsplash.com/400x400/?kimchi-fried-rice,korean',
  부대찌개: 'https://source.unsplash.com/400x400/?army-stew,korean-hot-pot',
  삼계탕: 'https://source.unsplash.com/400x400/?ginseng-chicken-soup,samgyetang',
  돼지갈비: 'https://source.unsplash.com/400x400/?pork-ribs,bbq,korean',
  해물파전: 'https://source.unsplash.com/400x400/?seafood-pancake,korean-pancake',
  순두부찌개: 'https://source.unsplash.com/400x400/?soft-tofu-stew,korean',
  닭볶음탕: 'https://source.unsplash.com/400x400/?spicy-chicken-stew,korean',
  감자탕: 'https://source.unsplash.com/400x400/?pork-bone-soup,gamjatang',
  쌈밥: 'https://source.unsplash.com/400x400/?korean-lettuce-wrap,ssam',
  족발: 'https://source.unsplash.com/400x400/?pigs-feet,jokbal,korean',

  // === 중식 (15개) ===
  짜장면: 'https://source.unsplash.com/400x400/?jajangmyeon,black-bean-noodles',
  짬뽕: 'https://source.unsplash.com/400x400/?spicy-seafood-noodles,jjamppong',
  탕수육: 'https://source.unsplash.com/400x400/?sweet-sour-pork,tangsuyuk',
  볶음밥: 'https://source.unsplash.com/400x400/?fried-rice,chinese',
  마라탕: 'https://source.unsplash.com/400x400/?mala-tang,spicy-hot-pot',
  마라샹궈: 'https://source.unsplash.com/400x400/?mala-xiangguo,stir-fry',
  양장피: 'https://source.unsplash.com/400x400/?yangjangpi,chinese-salad',
  깐풍기: 'https://source.unsplash.com/400x400/?sweet-chili-chicken,chinese',
  유산슬: 'https://source.unsplash.com/400x400/?yusanseul,chinese-vegetables',
  울면: 'https://source.unsplash.com/400x400/?wulmyeon,chinese-noodles',
  유니짜장: 'https://source.unsplash.com/400x400/?uni-jjajang,black-bean-noodles',
  삼선짬뽕: 'https://source.unsplash.com/400x400/?premium-jjamppong,seafood-noodles',
  짬짜면: 'https://source.unsplash.com/400x400/?jjamjjamyeon,half-half-noodles',
  고추잡채: 'https://source.unsplash.com/400x400/?gochu-japchae,stir-fry',
  라조기: 'https://source.unsplash.com/400x400/?lajogi,fried-chicken,chinese',

  // === 일식 (15개) ===
  초밥: 'https://source.unsplash.com/400x400/?sushi,nigiri,japanese',
  라멘: 'https://source.unsplash.com/400x400/?ramen,japanese-noodles',
  돈카츠: 'https://source.unsplash.com/400x400/?tonkatsu,pork-cutlet,japanese',
  우동: 'https://source.unsplash.com/400x400/?udon,japanese-noodles',
  소바: 'https://source.unsplash.com/400x400/?soba,buckwheat-noodles',
  규동: 'https://source.unsplash.com/400x400/?gyudon,beef-bowl,japanese',
  오코노미야끼: 'https://source.unsplash.com/400x400/?okonomiyaki,japanese-pancake',
  타코야키: 'https://source.unsplash.com/400x400/?takoyaki,octopus-balls',
  가라아게: 'https://source.unsplash.com/400x400/?karaage,japanese-fried-chicken',
  텐동: 'https://source.unsplash.com/400x400/?tendon,tempura-bowl',
  장어덮밥: 'https://source.unsplash.com/400x400/?unagi-don,eel-rice-bowl',
  야끼소바: 'https://source.unsplash.com/400x400/?yakisoba,fried-noodles',
  샤브샤브: 'https://source.unsplash.com/400x400/?shabu-shabu,hot-pot,japanese',
  회덮밥: 'https://source.unsplash.com/400x400/?hoe-deopbap,raw-fish-bowl',
  연어덮밥: 'https://source.unsplash.com/400x400/?salmon-bowl,japanese',

  // === 양식 (15개) ===
  피자: 'https://source.unsplash.com/400x400/?pizza,italian',
  파스타: 'https://source.unsplash.com/400x400/?pasta,spaghetti,italian',
  스테이크: 'https://source.unsplash.com/400x400/?steak,beef,grilled',
  리조또: 'https://source.unsplash.com/400x400/?risotto,italian-rice',
  햄버거: 'https://source.unsplash.com/400x400/?hamburger,burger',
  샌드위치: 'https://source.unsplash.com/400x400/?sandwich,bread',
  샐러드: 'https://source.unsplash.com/400x400/?salad,vegetables,healthy',
  그라탕: 'https://source.unsplash.com/400x400/?gratin,baked,cheese',
  오믈렛: 'https://source.unsplash.com/400x400/?omelette,egg,breakfast',
  크림수프: 'https://source.unsplash.com/400x400/?cream-soup,western',
  치킨까스: 'https://source.unsplash.com/400x400/?chicken-cutlet,fried-chicken',
  피쉬앤칩스: 'https://source.unsplash.com/400x400/?fish-and-chips,fried-fish',
  새우튀김: 'https://source.unsplash.com/400x400/?fried-shrimp,tempura',
  미트볼: 'https://source.unsplash.com/400x400/?meatballs,pasta',
  라자냐: 'https://source.unsplash.com/400x400/?lasagna,italian,pasta',

  // === 분식 (10개) ===
  떡볶이: 'https://source.unsplash.com/400x400/?tteokbokki,korean-street-food',
  순대: 'https://source.unsplash.com/400x400/?sundae,korean-sausage',
  튀김: 'https://source.unsplash.com/400x400/?korean-tempura,fried-food',
  김밥: 'https://source.unsplash.com/400x400/?kimbap,korean-roll,seaweed',
  라면: 'https://source.unsplash.com/400x400/?ramyeon,instant-noodles,korean',
  만두: 'https://source.unsplash.com/400x400/?mandu,korean-dumplings',
  컵라면: 'https://source.unsplash.com/400x400/?cup-noodles,instant-ramen',
  어묵: 'https://source.unsplash.com/400x400/?fish-cake,eomuk,korean',
  국물떡볶이: 'https://source.unsplash.com/400x400/?soupy-tteokbokki,korean',
  쫄면: 'https://source.unsplash.com/400x400/?jjolmyeon,chewy-noodles',

  // === 치킨 (10개) ===
  후라이드치킨: 'https://source.unsplash.com/400x400/?fried-chicken,crispy',
  양념치킨: 'https://source.unsplash.com/400x400/?korean-fried-chicken,spicy-chicken',
  간장치킨: 'https://source.unsplash.com/400x400/?soy-garlic-chicken,korean',
  마늘치킨: 'https://source.unsplash.com/400x400/?garlic-chicken,fried',
  파닭: 'https://source.unsplash.com/400x400/?green-onion-chicken,korean',
  반반치킨: 'https://source.unsplash.com/400x400/?half-half-chicken,fried',
  뿌링클: 'https://source.unsplash.com/400x400/?powder-chicken,korean-chicken',
  허니콤보: 'https://source.unsplash.com/400x400/?honey-chicken,fried-chicken',
  핫치킨: 'https://source.unsplash.com/400x400/?hot-chicken,spicy-fried',
  순살치킨: 'https://source.unsplash.com/400x400/?boneless-chicken,fried',

  // === 디저트 (10개) ===
  아이스크림: 'https://source.unsplash.com/400x400/?ice-cream,dessert',
  케이크: 'https://source.unsplash.com/400x400/?cake,dessert,sweet',
  마카롱: 'https://source.unsplash.com/400x400/?macaron,french-dessert',
  타르트: 'https://source.unsplash.com/400x400/?tart,dessert,pastry',
  초콜릿: 'https://source.unsplash.com/400x400/?chocolate,dessert',
  도넛: 'https://source.unsplash.com/400x400/?donut,doughnut,dessert',
  쿠키: 'https://source.unsplash.com/400x400/?cookies,dessert,baked',
  푸딩: 'https://source.unsplash.com/400x400/?pudding,dessert,sweet',
  젤라또: 'https://source.unsplash.com/400x400/?gelato,italian-ice-cream',
  와플: 'https://source.unsplash.com/400x400/?waffle,dessert,breakfast',

  // === 패스트푸드 (5개) ===
  감자튀김: 'https://source.unsplash.com/400x400/?french-fries,potato',
  핫도그: 'https://source.unsplash.com/400x400/?hot-dog,fast-food',
  치즈버거: 'https://source.unsplash.com/400x400/?cheeseburger,burger',
  너겟: 'https://source.unsplash.com/400x400/?chicken-nuggets,fast-food',
  타코: 'https://source.unsplash.com/400x400/?taco,mexican-food',
}

// 이미지가 없는 경우 기본 음식 이미지
export const defaultFoodImage = 'https://source.unsplash.com/400x400/?food,delicious'

// 음식 이름으로 이미지 URL 가져오기
export function getFoodImage(foodName: string): string {
  return unsplashImages[foodName] || defaultFoodImage
}
