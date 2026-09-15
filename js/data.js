(function () {
  "use strict";

  const STORAGE_KEY = "sweet_layer_bakery_data_v1";
  const CART_KEY = "sweet_layer_bakery_cart_v1";

  const themes = [
    ["#7b2d26", "#f7d6c4", "#4b1f19"],
    ["#2f1c16", "#f8efe6", "#4a251d"],
    ["#b23a48", "#fff1f3", "#80303b"],
    ["#c47f22", "#fff0c2", "#9b5a10"],
    ["#f2b84b", "#fff7de", "#d88a1d"],
    ["#d8476b", "#ffe5ed", "#b32f55"],
    ["#f2994a", "#fff0db", "#bf5b24"],
    ["#5661a7", "#e8ecff", "#343c7a"],
    ["#60412a", "#f1e0d1", "#3d2619"],
    ["#3c2d25", "#fff0dc", "#5a3324"],
    ["#292929", "#f2f2f2", "#141414"],
    ["#7a5536", "#f3dfc7", "#4b321f"],
    ["#679436", "#fff8d8", "#8f6d18"],
    ["#c94d6d", "#fff0f2", "#9b314d"],
    ["#ad5b2b", "#ffe4c9", "#7d351b"],
    ["#2d7d78", "#f1fff8", "#f2a541"],
    ["#d64f7f", "#e8f6ff", "#f6c945"],
    ["#a55c2b", "#fff4db", "#6e3a1f"],
    ["#9a6a3a", "#fbefe1", "#694425"],
    ["#6d4c41", "#f6eee8", "#3d2b25"],
    ["#5b4636", "#e6d2bf", "#2c2018"],
    ["#ededed", "#ffffff", "#7d4b38"],
    ["#d9ad67", "#fff7e8", "#9d7144"],
    ["#7ab8a6", "#f2fffb", "#3c7d70"],
    ["#d0677f", "#fff1f4", "#a13f56"]
  ];

  const productRows = [
    [
      "Chocolate Truffle",
      "Chocolate Classics",
      "Dense cocoa sponge layered with silky chocolate ganache.",
      "Chocolate sponge, ganache, cocoa glaze, chocolate curls.",
      [520, 920, 1350, 1760]
    ],
    [
      "Black Forest Cherry",
      "Chocolate Classics",
      "Classic chocolate cake with whipped cream and cherry filling.",
      "Chocolate sponge, whipped cream, cherry compote, chocolate flakes.",
      [480, 860, 1260, 1640]
    ],
    [
      "Red Velvet Cream Cheese",
      "Premium Specials",
      "Soft red velvet layers finished with cream cheese frosting.",
      "Red velvet sponge, cream cheese frosting, vanilla crumb.",
      [620, 1120, 1640, 2150]
    ],
    [
      "Butterscotch Praline",
      "Cream Cakes",
      "Vanilla sponge with butterscotch cream and crisp praline.",
      "Vanilla sponge, butterscotch sauce, praline crunch.",
      [460, 820, 1210, 1580]
    ],
    [
      "Pineapple Sunshine",
      "Fruit Cakes",
      "Light cream cake packed with pineapple chunks and glaze.",
      "Vanilla sponge, pineapple crush, whipped cream, pineapple glaze.",
      [430, 760, 1130, 1480]
    ],
    [
      "Strawberry Vanilla Cloud",
      "Fruit Cakes",
      "Vanilla cake with strawberry cream and fresh berry notes.",
      "Vanilla sponge, strawberry compote, whipped cream.",
      [490, 880, 1300, 1680]
    ],
    [
      "Mango Mousse Cake",
      "Fruit Cakes",
      "Bright mango mousse over soft vanilla layers.",
      "Vanilla sponge, mango mousse, mango glaze.",
      [560, 990, 1460, 1900]
    ],
    [
      "Blueberry Cream Cake",
      "Fruit Cakes",
      "Creamy blueberry filling with a soft vanilla base.",
      "Vanilla sponge, blueberry compote, whipped cream.",
      [570, 1010, 1490, 1940]
    ],
    [
      "Dutch Cocoa Fudge",
      "Chocolate Classics",
      "Deep chocolate fudge cake for rich cocoa lovers.",
      "Dutch cocoa sponge, fudge sauce, dark chocolate flakes.",
      [590, 1060, 1560, 2040]
    ],
    [
      "Choco Vanilla Marble",
      "Cream Cakes",
      "A neat swirl of chocolate and vanilla in every slice.",
      "Marble sponge, vanilla cream, chocolate drizzle.",
      [450, 790, 1170, 1530]
    ],
    [
      "Cookies and Cream",
      "Chocolate Classics",
      "Chocolate layers with crushed cookie cream and smooth frosting.",
      "Chocolate sponge, cookie crumb, vanilla cream.",
      [540, 970, 1430, 1860]
    ],
    [
      "Coffee Walnut",
      "Premium Specials",
      "Coffee soaked sponge finished with roasted walnut crunch.",
      "Coffee sponge, mocha cream, roasted walnuts.",
      [610, 1090, 1610, 2100]
    ],
    [
      "Kesar Pista",
      "Premium Specials",
      "Saffron cream cake with pistachio and cardamom notes.",
      "Vanilla sponge, saffron cream, pistachio, cardamom.",
      [640, 1160, 1710, 2240]
    ],
    [
      "Rasmalai Fusion",
      "Premium Specials",
      "Indian dessert inspired cake with rasmalai cream.",
      "Saffron sponge, rasmalai cream, pistachio garnish.",
      [690, 1260, 1850, 2420]
    ],
    [
      "Gulab Jamun Celebration",
      "Celebration Cakes",
      "Soft cake layered with gulab jamun pieces and rabdi cream.",
      "Vanilla sponge, rabdi cream, gulab jamun, nuts.",
      [660, 1210, 1780, 2320]
    ],
    [
      "Fresh Fruit Gateau",
      "Fruit Cakes",
      "Colorful fruit cake with light cream and seasonal toppings.",
      "Vanilla sponge, whipped cream, fresh seasonal fruits.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Rainbow Sprinkle",
      "Celebration Cakes",
      "Bright vanilla cake made for birthdays and happy tables.",
      "Vanilla sponge, rainbow sprinkles, buttercream.",
      [500, 900, 1330, 1740]
    ],
    [
      "Caramel Almond",
      "Premium Specials",
      "Caramel cream cake finished with toasted almond flakes.",
      "Vanilla sponge, salted caramel, almond flakes.",
      [620, 1130, 1660, 2170]
    ],
    [
      "Biscoff Caramel",
      "Premium Specials",
      "Spiced biscuit cream with caramel layers and crumb topping.",
      "Vanilla sponge, biscuit spread, caramel, biscuit crumb.",
      [680, 1240, 1820, 2380]
    ],
    [
      "Tiramisu Cream",
      "Premium Specials",
      "Coffee cream cake with cocoa dusting and soft mascarpone notes.",
      "Coffee sponge, mascarpone style cream, cocoa dust.",
      [700, 1280, 1880, 2460]
    ],
    [
      "Mocha Hazelnut",
      "Chocolate Classics",
      "Mocha chocolate cake with hazelnut crunch.",
      "Chocolate sponge, coffee cream, hazelnut praline.",
      [650, 1180, 1740, 2270]
    ],
    [
      "White Forest",
      "Cream Cakes",
      "White chocolate cream cake with cherries and vanilla sponge.",
      "Vanilla sponge, white chocolate cream, cherries.",
      [510, 920, 1360, 1770]
    ],
    [
      "Classic Vanilla Bean",
      "Cream Cakes",
      "Clean vanilla cake with smooth cream and a soft crumb.",
      "Vanilla sponge, vanilla bean cream, white chocolate garnish.",
      [420, 740, 1100, 1440]
    ],
    [
      "Tender Coconut",
      "Fruit Cakes",
      "Refreshing coconut cream cake with soft tropical flavor.",
      "Vanilla sponge, coconut cream, tender coconut pieces.",
      [580, 1040, 1530, 2000]
    ],
    [
      "Anniversary Rose Cake",
      "Celebration Cakes",
      "Elegant rose cream cake for anniversaries and intimate parties.",
      "Vanilla sponge, rose cream, floral piping, white chocolate.",
      [640, 1160, 1710, 2240]
    ],
    [
      "Hazelnut Praline Crunch",
      "Chocolate Classics",
      "Roasted hazelnut cream cake with a crisp praline finish.",
      "Chocolate sponge, hazelnut cream, praline crunch, cocoa glaze.",
      [680, 1240, 1820, 2380]
    ],
    [
      "Dark Chocolate Cherry",
      "Chocolate Classics",
      "Dark chocolate cake layered with cherries and whipped cream.",
      "Dark cocoa sponge, cherry filling, whipped cream, chocolate curls.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Salted Caramel Chocolate",
      "Chocolate Classics",
      "Rich chocolate layers with smooth salted caramel buttercream.",
      "Chocolate sponge, salted caramel, chocolate ganache, sea salt.",
      [650, 1180, 1740, 2280]
    ],
    [
      "Chocolate Orange Zest",
      "Chocolate Classics",
      "Bright orange zest meets deep chocolate in every slice.",
      "Cocoa sponge, orange curd, chocolate cream, candied orange.",
      [600, 1090, 1600, 2100]
    ],
    [
      "Triple Chocolate Mousse",
      "Chocolate Classics",
      "A silky three-layer mousse cake for serious chocolate lovers.",
      "Chocolate sponge, dark mousse, milk mousse, white chocolate.",
      [720, 1320, 1940, 2520]
    ],
    [
      "Espresso Fudge Cake",
      "Chocolate Classics",
      "Bold espresso and fudge combine in a smooth café-style cake.",
      "Coffee cocoa sponge, espresso cream, fudge sauce, cocoa dust.",
      [640, 1160, 1710, 2240]
    ],
    [
      "Pistachio Rose Cake",
      "Premium Specials",
      "Delicate rose cream with pistachio crunch and a soft crumb.",
      "Vanilla sponge, rose cream, pistachio praline, rose petals.",
      [700, 1280, 1880, 2460]
    ],
    [
      "Saffron Almond Cream",
      "Premium Specials",
      "A fragrant saffron cake finished with toasted almond flakes.",
      "Saffron sponge, almond cream, cardamom, toasted almonds.",
      [680, 1240, 1820, 2380]
    ],
    [
      "Lotus Biscoff Dream",
      "Premium Specials",
      "Creamy biscuit spread cake with caramelized cookie crunch.",
      "Vanilla sponge, Biscoff spread, biscuit cream, cookie crumb.",
      [690, 1260, 1850, 2420]
    ],
    [
      "Matcha White Chocolate",
      "Premium Specials",
      "Earthy matcha cream balanced with smooth white chocolate.",
      "Vanilla sponge, matcha cream, white chocolate, almond crumb.",
      [720, 1320, 1940, 2520]
    ],
    [
      "Pecan Maple Cake",
      "Premium Specials",
      "Warm maple cream cake with toasted pecan texture.",
      "Maple sponge, pecan praline, maple cream, caramel drizzle.",
      [700, 1280, 1880, 2460]
    ],
    [
      "Blueberry Lemon Bliss",
      "Fruit Cakes",
      "Fresh blueberry and lemon cream create a bright summer cake.",
      "Vanilla sponge, blueberry compote, lemon cream, berry glaze.",
      [590, 1060, 1560, 2040]
    ],
    [
      "Raspberry White Chocolate",
      "Fruit Cakes",
      "Tart raspberry filling wrapped in white chocolate cream.",
      "Vanilla sponge, raspberry compote, white chocolate cream.",
      [650, 1180, 1740, 2280]
    ],
    [
      "Peach Cream Garden",
      "Fruit Cakes",
      "Soft peach and cream cake with a light floral finish.",
      "Vanilla sponge, peach compote, whipped cream, peach glaze.",
      [570, 1020, 1500, 1960]
    ],
    [
      "Lychee Rose Cloud",
      "Fruit Cakes",
      "A refreshing lychee cake with gentle rose cream.",
      "Vanilla sponge, lychee pieces, rose cream, fruit glaze.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Kiwi Lime Cream",
      "Fruit Cakes",
      "Zesty lime cream with bright kiwi pieces and vanilla layers.",
      "Vanilla sponge, kiwi, lime cream, kiwi glaze.",
      [560, 990, 1460, 1900]
    ],
    [
      "Passion Fruit Mousse",
      "Fruit Cakes",
      "Tropical passion fruit mousse over a delicate vanilla base.",
      "Vanilla sponge, passion fruit mousse, mango glaze.",
      [680, 1240, 1820, 2380]
    ],
    [
      "Cherry Almond Gateau",
      "Fruit Cakes",
      "Juicy cherry layers paired with almond cream and soft sponge.",
      "Almond sponge, cherry compote, almond cream, toasted flakes.",
      [640, 1160, 1710, 2240]
    ],
    [
      "Apple Cinnamon Crumble",
      "Fruit Cakes",
      "Comforting apple cake with cinnamon cream and crisp crumble.",
      "Cinnamon sponge, apple compote, cream, oat crumble.",
      [540, 960, 1410, 1840]
    ],
    [
      "Classic Coffee Cream",
      "Cream Cakes",
      "Light coffee cream cake with a gentle roasted finish.",
      "Vanilla sponge, coffee cream, caramel drizzle, cocoa dust.",
      [520, 940, 1380, 1800]
    ],
    [
      "Honey Vanilla Silk",
      "Cream Cakes",
      "Soft vanilla cake sweetened with floral honey cream.",
      "Vanilla sponge, honey cream, white chocolate curls.",
      [450, 810, 1200, 1560]
    ],
    [
      "Milk Cream Tres Leches",
      "Cream Cakes",
      "Moist milk-soaked sponge topped with a cloud of cream.",
      "Vanilla sponge, three-milk soak, whipped cream, cinnamon.",
      [560, 1020, 1500, 1960]
    ],
    [
      "Vanilla Chai Cake",
      "Cream Cakes",
      "Warm chai spices folded into a smooth vanilla cream cake.",
      "Chai sponge, vanilla cream, cardamom, cinnamon crumb.",
      [500, 900, 1330, 1740]
    ],
    [
      "Coconut Lime Cream",
      "Cream Cakes",
      "A cool coconut cake lifted with fresh lime and cream.",
      "Coconut sponge, lime cream, coconut flakes, lime glaze.",
      [560, 1010, 1490, 1940]
    ],
    [
      "Almond Milk Cake",
      "Cream Cakes",
      "Tender almond sponge with delicate vanilla milk cream.",
      "Almond sponge, milk cream, almond flakes, vanilla glaze.",
      [550, 990, 1460, 1900]
    ],
    [
      "Earl Grey Cream Cake",
      "Cream Cakes",
      "Fragrant Earl Grey tea cream gives this cake a refined finish.",
      "Vanilla sponge, Earl Grey cream, bergamot glaze, white chocolate.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Carrot Walnut Celebration",
      "Celebration Cakes",
      "Moist spiced carrot cake with cream cheese frosting.",
      "Carrot sponge, walnuts, cream cheese frosting, cinnamon.",
      [580, 1040, 1530, 2000]
    ],
    [
      "Confetti Party Cake",
      "Celebration Cakes",
      "A cheerful sprinkle cake made for bright birthday tables.",
      "Vanilla sponge, rainbow sprinkles, vanilla buttercream.",
      [500, 900, 1330, 1740]
    ],
    [
      "Princess Pink Cake",
      "Celebration Cakes",
      "Soft pink vanilla layers with playful piped decorations.",
      "Vanilla sponge, strawberry cream, pink buttercream, sprinkles.",
      [540, 970, 1430, 1860]
    ],
    [
      "Blue Ocean Birthday Cake",
      "Celebration Cakes",
      "A cool blue celebration cake for ocean-loving dreamers.",
      "Vanilla sponge, blue vanilla cream, fondant waves, sprinkles.",
      [560, 1010, 1490, 1940]
    ],
    [
      "Photo Memory Cake",
      "Celebration Cakes",
      "A smooth celebration cake designed for a favorite edible photo.",
      "Vanilla sponge, buttercream, edible image finish, sprinkles.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Baby Shower Vanilla",
      "Celebration Cakes",
      "A gentle vanilla celebration cake for welcoming a little one.",
      "Vanilla sponge, pastel buttercream, white chocolate decorations.",
      [590, 1060, 1560, 2040]
    ],
    [
      "Graduation Chocolate Cake",
      "Celebration Cakes",
      "A rich chocolate cake for proud milestones and big achievements.",
      "Chocolate sponge, fudge cream, chocolate plaque, cocoa glaze.",
      [620, 1120, 1650, 2160]
    ],
    [
      "Rose Pistachio Celebration",
      "Celebration Cakes",
      "A floral pistachio cake made for elegant family celebrations.",
      "Pistachio sponge, rose cream, pistachio crumb, rose petals.",
      [680, 1240, 1820, 2380]
    ],
    [
      "Wedding White Chocolate",
      "Celebration Cakes",
      "A graceful white chocolate cake for intimate wedding tables.",
      "Vanilla sponge, white chocolate cream, floral piping, berries.",
      [760, 1380, 2020, 2640]
    ]
  ];

  function createProducts() {
    return productRows.map((row, index) => {
      const theme = themes[index % themes.length];
      return {
        id: `cake-${String(index + 1).padStart(3, "0")}`,
        name: row[0],
        category: row[1],
        description: row[2],
        details: row[3],
        variants: [
          { kg: "0.5 kg", price: row[4][0] },
          { kg: "1 kg", price: row[4][1] }
        ],
        image: "",
        accent: theme[0],
        frosting: theme[1],
        cakeColor: theme[2],
        active: true
      };
    });
  }

  function cleanVariants(variants, fallbackVariants) {
    const source = Array.isArray(variants) && variants.length ? variants : fallbackVariants || [];
    return source
      .map((variant) => {
        return {
          kg: String(variant.kg || "").trim(),
          price: Number(variant.price) || 0
        };
      })
      .filter((variant) => {
        const normalizedKg = variant.kg.toLowerCase().replace(/\s+/g, "");
        return variant.kg && variant.price > 0 && normalizedKg !== "1.5kg" && normalizedKg !== "2kg";
      });
  }

  function findProductByName(products, name) {
    const normalized = String(name || "").trim().toLowerCase();
    return products.find((product) => product.name.toLowerCase() === normalized);
  }

  function specialProductFields(products, cakeName) {
    const product = findProductByName(products, cakeName);
    if (!product) {
      return {
        category: "Special Day Cakes",
        description: "Limited celebration cake prepared for a special day.",
        details: "Fresh sponge, smooth frosting, and custom celebration finish.",
        variants: [
          { kg: "0.5 kg", price: 550 },
          { kg: "1 kg", price: 990 }
        ]
      };
    }

    return {
      category: product.category,
      description: product.description,
      details: product.details,
      variants: cleanVariants(product.variants)
    };
  }

  function normalizeSpecial(special, products, fallbackSpecial) {
    const fallbackFields = specialProductFields(products, special.cakeName || fallbackSpecial?.cakeName);
    const fallback = fallbackSpecial || {};

    return {
      ...fallback,
      ...special,
      category: special.category || fallback.category || fallbackFields.category,
      description: special.description || fallback.description || fallbackFields.description,
      details: special.details || fallback.details || fallbackFields.details,
      variants: cleanVariants(special.variants, fallback.variants || fallbackFields.variants),
      image: special.image || "",
      accent: special.accent || fallback.accent || "#b23a48",
      active: special.active !== false
    };
  }

  function getDefaultData() {
    const products = createProducts();
    const birthdayFields = specialProductFields(products, "Rainbow Sprinkle");
    const anniversaryFields = specialProductFields(products, "Anniversary Rose Cake");
    const festiveFields = specialProductFields(products, "Rasmalai Fusion");

    return {
      banners: [
        {
          id: "banner-well-baked",
          eyebrow: "Freshly baked today",
          title: "Well Baked",
          description: "Handcrafted cakes, rich chocolate layers, fresh fruit, and celebration flavors made for your sweetest moments.",
          buttonLabel: "Explore cakes",
          image: "",
          accent: "#d64f7f",
          frosting: "#fff1f3",
          cakeColor: "#7b2d26",
          active: true
        },
        {
          id: "banner-celebrate",
          eyebrow: "Make the moment sweeter",
          title: "Celebrate Every Slice",
          description: "Choose the perfect cake size and add party extras for birthdays, anniversaries, and every happy gathering.",
          buttonLabel: "View celebration cakes",
          image: "",
          accent: "#c47f22",
          frosting: "#fff3ce",
          cakeColor: "#9b5a10",
          active: true
        },
        {
          id: "banner-specials",
          eyebrow: "Limited celebration picks",
          title: "Something Special",
          description: "Discover premium flavors and special-day favorites prepared fresh for your table.",
          buttonLabel: "See special cakes",
          image: "",
          accent: "#2d7d78",
          frosting: "#effffc",
          cakeColor: "#1f5b55",
          active: true
        }
      ],
      settings: {
        bakeryName: "Well Baked",
        ownerEmail: "ngw.designer@gmail.com",
        phone: "+91 98765 43210",
        address: "Cake Street, Your City",
        adminPasscode: "owner123",
        emailjs: {
          publicKey: "bErS5uMcw3hPVUd01",
          serviceId: "service_l9tcf9a",
          customerTemplateId: "template_suyw6ao",
          ownerTemplateId: "template_a9i8r6e"
        }
      },
      categories: [
        "Chocolate Classics",
        "Cream Cakes",
        "Fruit Cakes",
        "Celebration Cakes",
        "Premium Specials"
      ],
      products,
      addOns: [
        {
          id: "addon-candles",
          name: "Birthday Candles",
          description: "Colorful candles for the celebration cake.",
          price: 80,
          image: "",
          accent: "#d64f7f",
          frosting: "#fff1f3",
          cakeColor: "#f2b84b",
          active: true
        },
        {
          id: "addon-party-hats",
          name: "Party Hats",
          description: "A cheerful set of celebration hats.",
          price: 120,
          image: "",
          accent: "#5661a7",
          frosting: "#edf0ff",
          cakeColor: "#2d7d78",
          active: true
        },
        {
          id: "addon-cake-pops",
          name: "Cake Pops",
          description: "Six bite-size cake pops for the dessert table.",
          price: 240,
          image: "",
          accent: "#c47f22",
          frosting: "#fff3ce",
          cakeColor: "#b23a48",
          active: true
        },
        {
          id: "addon-balloons",
          name: "Celebration Balloons",
          description: "A colorful balloon set for the party corner.",
          price: 180,
          image: "",
          accent: "#2d7d78",
          frosting: "#effffc",
          cakeColor: "#d64f7f",
          active: true
        },
        {
          id: "addon-greeting-card",
          name: "Greeting Card",
          description: "A small card for your personal celebration message.",
          price: 60,
          image: "",
          accent: "#b23a48",
          frosting: "#fff1f3",
          cakeColor: "#c47f22",
          active: true
        },
        {
          id: "addon-party-set",
          name: "Plates and Knife Set",
          description: "Disposable plates, forks, and a cake knife.",
          price: 150,
          image: "",
          accent: "#6d4c41",
          frosting: "#f6eee8",
          cakeColor: "#3d2b25",
          active: true
        }
      ],
      specials: [
        {
          id: "special-birthday",
          title: "Birthday Week",
          cakeName: "Rainbow Sprinkle",
          dateLabel: "All week",
          message: "Add a custom name and birthday message during checkout.",
          category: birthdayFields.category,
          description: birthdayFields.description,
          details: birthdayFields.details,
          variants: birthdayFields.variants,
          image: "",
          accent: "#d64f7f",
          active: true
        },
        {
          id: "special-anniversary",
          title: "Anniversary Special",
          cakeName: "Anniversary Rose Cake",
          dateLabel: "This month",
          message: "Elegant rose piping for small and large celebrations.",
          category: anniversaryFields.category,
          description: anniversaryFields.description,
          details: anniversaryFields.details,
          variants: anniversaryFields.variants,
          image: "",
          accent: "#b23a48",
          active: true
        },
        {
          id: "special-festive",
          title: "Festive Dessert Table",
          cakeName: "Rasmalai Fusion",
          dateLabel: "Limited time",
          message: "Indian dessert inspired cakes for family gatherings.",
          category: festiveFields.category,
          description: festiveFields.description,
          details: festiveFields.details,
          variants: festiveFields.variants,
          image: "",
          accent: "#c47f22",
          active: true
        }
      ],
      orders: []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeData(input) {
    const defaults = getDefaultData();
    const data = input && typeof input === "object" ? input : {};
    const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    const emailjs = settings.emailjs && typeof settings.emailjs === "object" ? settings.emailjs : {};
    const savedProducts = Array.isArray(data.products) ? data.products : [];
    // Respect exactly what the owner saved — do NOT re-merge the demo
    // defaults here. That merge resurrected deleted products on every
    // save/load. Defaults still apply when the stored list is missing
    // entirely (fresh browser or corrupt data).
    const products = savedProducts.map((product, index) => {
      const fallbackProduct = defaults.products.find((entry) => entry.id === product.id) || defaults.products[index] || defaults.products[0];
      return {
        ...product,
        variants: cleanVariants(product.variants, fallbackProduct.variants)
      };
    });
    const specialSource = Array.isArray(data.specials) ? data.specials : defaults.specials;

    return {
      banners: (Array.isArray(data.banners) && data.banners.length ? data.banners : defaults.banners).map((banner) => ({
        ...banner,
        title: banner.title === ["Sweet", "Layer", "Bakery"].join(" ") ? "Well Baked" : banner.title
      })),
      settings: {
        ...defaults.settings,
        ...settings,
        bakeryName:
          settings.bakeryName === ["Sweet", "Layer", "Bakery"].join(" ")
            ? defaults.settings.bakeryName
            : settings.bakeryName || defaults.settings.bakeryName,
        ownerEmail:
          settings.ownerEmail === "owner@example.com"
            ? defaults.settings.ownerEmail
            : settings.ownerEmail || defaults.settings.ownerEmail,
        emailjs: {
          ...defaults.settings.emailjs,
          ...emailjs,
          publicKey: emailjs.publicKey || defaults.settings.emailjs.publicKey,
          serviceId: emailjs.serviceId || defaults.settings.emailjs.serviceId,
          customerTemplateId: emailjs.customerTemplateId || defaults.settings.emailjs.customerTemplateId,
          ownerTemplateId: emailjs.ownerTemplateId || defaults.settings.emailjs.ownerTemplateId
        }
      },
      categories: Array.isArray(data.categories) && data.categories.length ? data.categories : defaults.categories,
      products,
      addOns: Array.isArray(data.addOns) && data.addOns.length ? data.addOns : defaults.addOns,
      specials: specialSource.map((special, index) => normalizeSpecial(special, products, defaults.specials[index])),
      orders: Array.isArray(data.orders) ? data.orders : []
    };
  }

  function pruneImagesToFit(data, targetSize) {
    // Storage is ~5MB. When a save overflows, drop only the largest embedded
    // photos (image URLs and small images stay) until the payload fits,
    // instead of wiping every image in the catalog.
    const payload = JSON.parse(JSON.stringify(data));
    const items = [];
    const collect = (container) => {
      if (!container || typeof container !== "object") {
        return;
      }
      if (Array.isArray(container)) {
        container.forEach(collect);
        return;
      }
      const image = container.image;
      if (typeof image === "string" && image.startsWith("data:") && image.length > 60 * 1024) {
        items.push({ object: container, label: container.name || container.title || "an item" });
      }
      Object.keys(container).forEach((key) => {
        if (key !== "image") {
          collect(container[key]);
        }
      });
    };
    collect(payload);
    const dropped = [];
    items.sort((a, b) => b.object.image.length - a.object.image.length);
    let size = JSON.stringify(payload).length;
    for (const item of items) {
      if (size <= targetSize) {
        break;
      }
      size -= item.object.image.length;
      item.object.image = "";
      if (!dropped.includes(item.label)) {
        dropped.push(item.label);
      }
    }
    return { data: payload, dropped };
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultData();
      saveData(defaults);
      return defaults;
    }

    try {
      const normalized = normalizeData(JSON.parse(raw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.warn("Bakery data was reset because it could not be read.", error);
      const defaults = getDefaultData();
      saveData(defaults);
      return defaults;
    }
  }

  function saveData(data) {
    const normalized = normalizeData(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return { ok: true };
    } catch (error) {
      // Most commonly QuotaExceededError: localStorage is ~5MB total and
      // base64 photos are large. Prune the largest embedded images until the
      // payload fits, so names, prices, and orders always save and only a
      // few photos are dropped (the owner can re-upload them).
      console.warn("Bakery save exceeded storage, pruning largest images.", error);
      try {
        const pruned = pruneImagesToFit(normalized, 4.5 * 1024 * 1024);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned.data));
        const droppedList = pruned.dropped.length ? " (" + pruned.dropped.join(", ") + ")" : "";
        return {
          ok: true,
          warning: "Storage was full, so " + pruned.dropped.length + " largest photo(s) were removed to make room" + droppedList + ". Everything else saved fine - re-upload those photos, or use image links instead of uploads."
        };
      } catch (retryError) {
        console.error("Bakery save failed even after pruning images.", retryError);
        return { ok: false, error: "Could not save in this browser. Storage may be full or blocked (private mode?). Free up space by deleting old items/orders, or use a normal browser window." };
      }
    }
  }

  function mergeCatalog(local, cloud) {
    // Cloud catalog wins entirely - the admin panel is the source of truth.
    const merged = { ...local, ...cloud };
    return normalizeData(merged);
  }

  async function pullCloudData() {
    if (typeof fetch !== "function") { return null; }
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) { return null; }
        const body = await response.json();
        if (!body.catalog) { return null; }
        const merged = mergeCatalog(loadData(), body.catalog);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (storageError) {
          // Phone storage may be too full to cache the catalog. Render it
          // from memory anyway - the visitor still sees the real menu.
          console.warn("Cloud catalog could not be cached locally; using it for this visit only.", storageError);
        }
        return merged;
      } catch (error) {
        if (attempt === 2) {
          console.warn("Cloud catalog pull skipped.", error);
          return null;
        }
        // Render free tier can sleep; give the server a moment and retry once.
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    return null;
  }

  async function pushCloudData(dataToPush, passcode) {
    if (typeof fetch !== "function") { return { ok: false, error: "fetch unavailable" }; }
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-passcode": String(passcode || "") },
        body: JSON.stringify(dataToPush)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { return { ok: false, error: (body.error ? body.error + " " : "") + "(" + response.status + ")" }; }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Cloud sync unreachable" };
    }
  }

  function resetData() {
    const defaults = getDefaultData();
    saveData(defaults);
    return defaults;
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createOrderId() {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("");
    return `SL-${date}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function formatPrice(value) {
    const number = Number(value) || 0;
    return `Rs. ${number.toLocaleString("en-IN")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };
      return map[char];
    });
  }

  function shortLabel(name) {
    return String(name || "Cake")
      .split(/\s+/)
      .slice(0, 2)
      .join(" ")
      .slice(0, 18);
  }

  function getProductImage(item) {
    if (item && item.image) {
      return item.image;
    }
    return makeCakeImage(item || {});
  }

  function makeCakeImage(item) {
    const accent = item.accent || "#b23a48";
    const frosting = item.frosting || "#fff1f3";
    const cakeColor = item.cakeColor || "#6b2d22";
    const label = escapeHtml(shortLabel(item.name || item.cakeName || item.title));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="720" viewBox="0 0 900 720">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${frosting}"/>
            <stop offset="1" stop-color="#ffffff"/>
          </linearGradient>
          <linearGradient id="cake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${accent}"/>
            <stop offset="1" stop-color="${cakeColor}"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#3b1f1a" flood-opacity=".2"/>
          </filter>
        </defs>
        <rect width="900" height="720" rx="46" fill="url(#bg)"/>
        <circle cx="140" cy="120" r="86" fill="${accent}" opacity=".12"/>
        <circle cx="770" cy="170" r="130" fill="#2d7d78" opacity=".1"/>
        <circle cx="725" cy="570" r="84" fill="#f2b84b" opacity=".16"/>
        <ellipse cx="450" cy="585" rx="290" ry="48" fill="#553228" opacity=".14"/>
        <g filter="url(#shadow)">
          <path d="M247 313c0-76 406-76 406 0v164c0 76-406 76-406 0z" fill="url(#cake)"/>
          <ellipse cx="450" cy="313" rx="203" ry="74" fill="${frosting}"/>
          <path d="M250 309c38 57 73 34 98 0 31 61 78 64 108 1 36 68 81 52 108 0 33 58 61 55 88 0v73c-24 48-64 44-91-1-33 52-79 55-111 3-33 50-82 48-111-4-28 49-63 48-89 2z" fill="${frosting}" opacity=".95"/>
          <ellipse cx="450" cy="296" rx="170" ry="52" fill="#ffffff" opacity=".5"/>
          <path d="M318 481c70 42 191 46 268 0" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity=".45"/>
          <g fill="${accent}">
            <circle cx="337" cy="250" r="13"/>
            <circle cx="419" cy="235" r="10"/>
            <circle cx="500" cy="239" r="12"/>
            <circle cx="575" cy="260" r="9"/>
          </g>
          <rect x="438" y="158" width="24" height="92" rx="12" fill="#f5c85b"/>
          <path d="M450 129c28 32 17 57 0 57s-28-25 0-57z" fill="#ff8f3f"/>
        </g>
        <text x="450" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#38241f">${label}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
  }

  function orderAddress(customer) {
    return [
      customer.address,
      customer.landmark ? `Landmark: ${customer.landmark}` : "",
      [customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildEmailParams(order, data) {
    const itemsText = order.items
      .map((item) => {
        const label = item.specialTitle ? `${item.name} - ${item.specialTitle}` : item.name;
        return `${label} (${item.kg}) x ${item.qty} = ${formatPrice(item.lineTotal)}`;
      })
      .join("\n");
    const customerDetails = [
      `Name: ${order.customer.name}`,
      `Email: ${order.customer.email}`,
      `Phone: ${order.customer.phone}`,
      `Address: ${orderAddress(order.customer)}`,
      `Instructions: ${order.customer.instructions || "None"}`
    ].join("\n");
    const orderDetails = [
      `Order ID: ${order.id}`,
      `Order date: ${new Date(order.createdAt).toLocaleString()}`,
      `Payment: ${order.paymentMethod}`,
      "",
      "Customer details:",
      customerDetails,
      "",
      "Items:",
      itemsText,
      "",
      `Total: ${formatPrice(order.total)}`
    ].join("\n");

    return {
      bakery_name: data.settings.bakeryName,
      owner_email: data.settings.ownerEmail,
      order_id: order.id,
      order_date: new Date(order.createdAt).toLocaleString(),
      customer_name: order.customer.name,
      customer_email: order.customer.email,
      customer_phone: order.customer.phone,
      customer_address: orderAddress(order.customer),
      delivery_date: order.customer.deliveryDate,
      instructions: order.customer.instructions || "None",
      payment_method: order.paymentMethod,
      items: itemsText,
      order_total: formatPrice(order.total),
      customer_details: customerDetails,
      order_details: orderDetails,
      to_email: order.customer.email,
      reply_to: order.customer.email,
      customer_message: `Thank you for your order. We received it successfully and will contact you very soon. Order ID: ${order.id}`,
      owner_message: `New order received from ${order.customer.name}. Please contact the customer very soon.`,
      customer_subject: `Order confirmation ${order.id}`,
      owner_subject: `New cake order ${order.id}`
    };
  }

  async function sendOrderEmails(order, data) {
    const cfg = data.settings.emailjs || {};
    const hasConfig =
      cfg.publicKey && cfg.serviceId && cfg.customerTemplateId && cfg.ownerTemplateId && data.settings.ownerEmail;

    if (!window.emailjs || !hasConfig) {
      return {
        sent: false,
        message: "EmailJS is not configured yet. The order was saved in the admin dashboard."
      };
    }

    try {
      window.emailjs.init({ publicKey: cfg.publicKey });
      const params = buildEmailParams(order, data);
      const customerParams = {
        ...params,
        to_email: order.customer.email,
        recipient_name: order.customer.name
      };
      const ownerParams = {
        ...params,
        to_email: data.settings.ownerEmail,
        recipient_name: data.settings.bakeryName
      };

      const results = await Promise.allSettled([
        window.emailjs.send(cfg.serviceId, cfg.customerTemplateId, customerParams),
        window.emailjs.send(cfg.serviceId, cfg.ownerTemplateId, ownerParams)
      ]);

      const failed = results.find((result) => result.status === "rejected");
      if (failed) {
        throw failed.reason;
      }

      return { sent: true, message: "Confirmation emails were sent to the customer and owner." };
    } catch (error) {
      console.error("EmailJS send failed", error);
      const providerMessage = error?.text || error?.message || String(error || "Unknown EmailJS error");
      return {
        sent: false,
        message: `The order was saved, but email sending failed: ${providerMessage}`
      };
    }
  }

  window.BakeryData = {
    STORAGE_KEY,
    CART_KEY,
    load: loadData,
    save: saveData,
    reset: resetData,
    pullCloudData,
    pushCloudData,
    createId,
    createOrderId,
    formatPrice,
    escapeHtml,
    getProductImage,
    getCart,
    saveCart,
    sendOrderEmails,
    clone
  };
})();
