import { Tutorial, TutorialCategory } from '../types';

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  'Digital Payments',
  'Online Business',
  'Digital Marketing',
  'Digital Safety',
];

export const LEARNING_TUTORIALS: Tutorial[] = [
  // 1. Digital Payments
  {
    id: 'tut-what-is-upi',
    title: 'What is UPI?',
    category: 'Digital Payments',
    difficulty: 'Beginner',
    readingTime: '3 min read',
    summary:
      'Understand how Unified Payments Interface (UPI) lets money move directly from a customer’s bank account to your bank account in seconds—with zero extra machine fees.',
    image: '/src/assets/images/learning_digital_payments_1794857947455.jpg',
    steps: [
      {
        heading: '1. Direct bank-to-bank transfer',
        explanation:
          'UPI connects your bank account to your mobile phone number. You do not need a credit card machine or complicated paperwork to accept cashless payments.',
      },
      {
        heading: '2. What is a UPI ID?',
        explanation:
          'A UPI ID looks like yourname@okaxis or shopname@ybl. It acts like a simple address for money, so you never have to share your bank account number or IFSC code with customers.',
      },
      {
        heading: '3. Instant settlement with zero change hassle',
        explanation:
          'Even for a ₹15 cutting chai or ₹35 coriander bunch, the exact rupee amount reaches your bank account immediately without needing coins or small notes.',
      },
    ],
    keyTip: 'Keep your registered bank mobile SIM active on the phone you carry at your stall so SMS alerts arrive on time.',
    avoidTip: 'Never think money has arrived just because a customer presses "Pay"—always wait for the confirmation screen or SMS.',
  },
  {
    id: 'tut-qr-payments',
    title: 'How QR code payments work',
    category: 'Digital Payments',
    difficulty: 'Beginner',
    readingTime: '4 min read',
    summary:
      'Learn how printing or displaying one static QR sticker lets customers pay using Google Pay, PhonePe, Paytm, or BHIM.',
    image: '/src/assets/images/learning_digital_payments_1794857947455.jpg',
    steps: [
      {
        heading: '1. One QR works for every app',
        explanation:
          'You do not need four separate QR stickers. Any standard UPI QR code works with BHIM, PhonePe, Google Pay, Paytm, and banking apps.',
      },
      {
        heading: '2. Place your QR at eye level',
        explanation:
          'Laminate your QR card and fix it near your weighing scale or counter so customers can scan comfortably without touching your phone.',
      },
      {
        heading: '3. Check the merchant name',
        explanation:
          'Ask new customers to verify your shop name aloud before entering their PIN so money never goes to a wrong number.',
      },
    ],
    keyTip: 'Inspect your laminated QR sticker every morning to ensure nobody has pasted a fake sticker over yours.',
    avoidTip: 'Never let a stranger stick a new QR poster on your cart without verifying it in your own banking app.',
  },
  {
    id: 'tut-receive-payments',
    title: 'How to receive digital payments',
    category: 'Digital Payments',
    difficulty: 'Easy Guide',
    readingTime: '4 min read',
    summary:
      'Step-by-step guide to verifying incoming payments calmly during busy evening rush hours at your cart or shop.',
    image: '/src/assets/images/vendor_chai_snacks_1794857946620.jpg',
    steps: [
      {
        heading: '1. Keep bank SMS or voice alerts enabled',
        explanation:
          'Turn on SMS alerts with your bank or enable a merchant voice notification in your UPI business app so you hear the exact amount received.',
      },
      {
        heading: '2. Cross-check Transaction History',
        explanation:
          'When rush hour is high, open "History" or "Recent Settlements" on your own phone to confirm the ₹ amount says "Received" or "Credited".',
      },
      {
        heading: '3. Track daily cash + UPI total',
        explanation:
          'At closing time, add your cash box total and your app’s Today Total together to know your exact daily earnings.',
      },
    ],
    keyTip: 'Remember: you NEVER enter your UPI PIN to receive money. PIN is only for sending money out.',
    avoidTip: 'Never scan a QR code sent by a buyer or click "Approve Request" to receive a payment.',
  },

  // 2. Online Business
  {
    id: 'tut-create-profile',
    title: 'How to create an online business profile',
    category: 'Online Business',
    difficulty: 'Beginner',
    readingTime: '4 min read',
    summary:
      'Turn your daily cart or neighborhood shop into a clear digital storefront that Mira-Bhayandar residents can bookmark and share.',
    image: '/src/assets/images/hero_indian_vendor_1794857942496.jpg',
    steps: [
      {
        heading: '1. Choose a clear, memorable shop name',
        explanation:
          'Include what you sell or a recognizable landmark—for example, "Patil Fresh Farm Cart" or "Sai Kripa Chaat & Vada Pav".',
      },
      {
        heading: '2. Add accurate area & landmark details',
        explanation:
          'Mention whether you stand near Mira Road Station, Shanti Park, Golden Nest Circle, or 60 Feet Road so locals find you quickly.',
      },
      {
        heading: '3. Keep opening hours updated',
        explanation:
          'Clearly note your morning and evening timings and weekly off-day so customers do not arrive when your stall is closed.',
      },
    ],
    keyTip: 'Ask two loyal neighborhood customers to check your profile and tell you if the landmark directions are easy to follow.',
    avoidTip: 'Avoid leaving your description blank—just 2 friendly sentences build strong trust.',
  },
  {
    id: 'tut-list-products',
    title: 'How to list products',
    category: 'Online Business',
    difficulty: 'Easy Guide',
    readingTime: '5 min read',
    summary:
      'Organize your top-selling items with honest Indian Rupee prices, clear units (per kg, per plate, per piece), and stock availability.',
    image: '/src/assets/images/vendor_vegetables_stall_1794857943239.jpg',
    steps: [
      {
        heading: '1. Start with your 4–5 bestselling items',
        explanation:
          'You do not have to upload every small item on day one. Begin with what people ask for most—such as seasonal mangoes, vada pav, or daily pulses.',
      },
      {
        heading: '2. Always mention the unit clearly',
        explanation:
          'Write "₹60 per kg" or "₹40 per plate (6 pcs)" so customers immediately understand what they get for the price.',
      },
      {
        heading: '3. Toggle availability when items sell out',
        explanation:
          'Use the In Stock / Out of Stock switch in your DigiThela Dashboard whenever an item finishes for the day.',
      },
    ],
    keyTip: 'Update prices once a week or whenever wholesale vegetable rates change significantly.',
    avoidTip: 'Do not use confusing codes or abbreviations in product names—write words customers actually search for.',
  },
  {
    id: 'tut-reach-customers',
    title: 'How to reach more customers',
    category: 'Online Business',
    difficulty: 'Easy Guide',
    readingTime: '4 min read',
    summary:
      'Simple ways to bring housing society groups, office commuters, and weekend shoppers from across Mira-Bhayandar to your stall.',
    image: '/src/assets/images/vendor_cotton_clothing_1794857943977.jpg',
    steps: [
      {
        heading: '1. Share your profile link in society groups',
        explanation:
          'Send your DigiThela page link to regular customers so they can forward it to neighbors in nearby residential complexes.',
      },
      {
        heading: '2. Highlight fresh morning arrivals',
        explanation:
          'Let customers know when fresh stock arrives—for example, fresh mogra garlands at 6 AM or hot snacks after 4 PM.',
      },
      {
        heading: '3. Offer clear WhatsApp pre-packing',
        explanation:
          'Busy commuters love picking up a pre-weighed vegetable or grocery bag on their walk home from Mira Road or Bhayandar station.',
      },
    ],
    keyTip: 'Polite service + transparent pricing turns a one-time passerby into a weekly repeat buyer.',
    avoidTip: 'Avoid spamming group chats multiple times a day—share one neat update in the morning.',
  },

  // 3. Digital Marketing
  {
    id: 'tut-social-media',
    title: 'Introduction to social media marketing',
    category: 'Digital Marketing',
    difficulty: 'Beginner',
    readingTime: '5 min read',
    summary:
      'Use WhatsApp Status and simple local posts—without spending money on ads—to show your daily fresh stock to existing buyers.',
    image: '/src/assets/images/vendor_flower_garlands_1794857944734.jpg',
    steps: [
      {
        heading: '1. Start with WhatsApp Status',
        explanation:
          'Every customer whose number you save can see your WhatsApp Status. Post one bright photo of today’s fresh mangoes, kurtis, or garlands at 9 AM.',
      },
      {
        heading: '2. Write simple captions with price & location',
        explanation:
          'Example: "Fresh Devgad Alphonso ₹480/dozen today at Shanti Nagar Gate till 9 PM. UPI accepted!"',
      },
      {
        heading: '3. Be consistent, not fancy',
        explanation:
          'Posting 3 times a week with real photos builds far more trust than flashy edited graphics.',
      },
    ],
    keyTip: 'Use local festival moments—Ganesh Chaturthi, Navratri, Diwali, Gudi Padwa—to showcase special items early.',
    avoidTip: 'Never download stock photos from the internet; customers trust real photos of your actual stall.',
  },
  {
    id: 'tut-photography',
    title: 'Product photography basics',
    category: 'Digital Marketing',
    difficulty: 'Easy Guide',
    readingTime: '4 min read',
    summary:
      'Take crisp, appetizing, bright photos of your food, vegetables, or clothes using any ordinary budget smartphone.',
    image: '/src/assets/images/vendor_chaat_food_1794857943606.jpg',
    steps: [
      {
        heading: '1. Wipe your phone camera lens first',
        explanation:
          'Oil or dust on the back lens makes photos look foggy. A quick wipe with a clean cotton cloth instantly makes pictures sharper.',
      },
      {
        heading: '2. Shoot in natural daylight',
        explanation:
          'Stand facing morning or afternoon sunlight—never put the bright sun behind the product, or the food/clothes will look dark.',
      },
      {
        heading: '3. Keep the background tidy',
        explanation:
          'Arrange baskets, steel plates, or folded kurtis neatly and clear away stray plastic bags from the frame before tapping the camera button.',
      },
    ],
    keyTip: 'Take photos slightly from a 45-degree angle so customers can see both the height and fullness of your items.',
    avoidTip: 'Avoid using harsh phone flash at night, which creates shiny glare on steel plates and plastic.',
  },
  {
    id: 'tut-promote-online',
    title: 'How to promote a small business online',
    category: 'Digital Marketing',
    difficulty: 'Easy Guide',
    readingTime: '5 min read',
    summary:
      'Practical zero-cost habits to make your small business easy to recommend and remember across Mira-Bhayandar.',
    image: '/src/assets/images/vendor_grocery_kirana_1794857944226.jpg',
    steps: [
      {
        heading: '1. Put a neat card with your DigiThela info',
        explanation:
          'Print or write your store name, timings, and phone number on a small cardboard card near your QR standee.',
      },
      {
        heading: '2. Create simple festive combo packs',
        explanation:
          'Bundle related items—like "Puja Garland + Mogra Pack" or "Chai + 2 Bun Maska"—so customers discover more of what you sell.',
      },
      {
        heading: '3. Ask happy customers to spread the word',
        explanation:
          'A friendly "If you liked the taste, tell your neighbors about our stall!" works wonders in tight-knit Mira-Bhayandar societies.',
      },
    ],
    keyTip: 'Keep your stall signage clean and readable from 10 feet away.',
    avoidTip: 'Do not promise discounts you cannot afford; honest quality and fair weight keep customers loyal.',
  },

  // 4. Digital Safety
  {
    id: 'tut-fake-screenshots',
    title: 'Recognising fake payment screenshots',
    category: 'Digital Safety',
    difficulty: 'Safety Essential',
    readingTime: '4 min read',
    summary:
      'Spot common tricks used by fraudsters who show edited "Payment Successful" images without actually sending money.',
    image: '/src/assets/images/learning_digital_payments_1794857947455.jpg',
    steps: [
      {
        heading: '1. Never trust only the buyer’s phone screen',
        explanation:
          'Fake apps can create realistic green checkmark screens in seconds. A screenshot on someone else’s phone is NOT proof of payment.',
      },
      {
        heading: '2. Verify on YOUR OWN device',
        explanation:
          'Wait for your bank SMS, your UPI merchant app notification, or check the Transaction History tab inside your own app.',
      },
      {
        heading: '3. Watch out for "Pending" messages',
        explanation:
          'If a screen says "Processing" or "Pending", the money has NOT arrived yet. Politely ask the buyer to wait 30 seconds or pay by cash.',
      },
    ],
    keyTip: 'Install a merchant soundbox or turn on audio notifications on your own phone if your stall gets crowded.',
    avoidTip: 'Never feel pressured when someone says "I am in a hurry, I already paid, look at my screen." Always verify on your phone first.',
  },
  {
    id: 'tut-upi-scams',
    title: 'Identifying common UPI scams',
    category: 'Digital Safety',
    difficulty: 'Safety Essential',
    readingTime: '5 min read',
    summary:
      'Protect your hard-earned daily revenue from "Collect Request" traps, fake customer-care calls, and lottery links.',
    image: '/src/assets/images/vendor_footwear_leather_1794857945865.jpg',
    steps: [
      {
        heading: '1. Beware of "Collect / Pay Request" popups',
        explanation:
          'Scammers sometimes say "I am sending ₹500 advance, please approve it on your app." Approving a Collect Request actually SENDS your money to them!',
      },
      {
        heading: '2. Ignore fake bank/KYC update calls',
        explanation:
          'No bank or UPI company will ever call to ask you to download a screen-sharing app (like AnyDesk or TeamViewer) to keep your account active.',
      },
      {
        heading: '3. Do not click unknown prize or cashback links',
        explanation:
          'Scratch-card or cashback links received from unknown WhatsApp numbers can steal your account access.',
      },
    ],
    keyTip: 'If someone asks you to enter your UPI PIN to "receive" a refund or advance, hang up immediately—it is 100% a scam.',
    avoidTip: 'Never install remote-access apps when guided by an unknown caller.',
  },
  {
    id: 'tut-never-share-otp',
    title: 'Never sharing OTP or UPI PIN',
    category: 'Digital Safety',
    difficulty: 'Safety Essential',
    readingTime: '3 min read',
    summary:
      'The golden rule of digital money: your 4-digit or 6-digit UPI PIN and SMS OTPs are like the keys to your cash box—keep them strictly private.',
    image: '/src/assets/images/vendor_tailor_alteration_1794857946936.jpg',
    steps: [
      {
        heading: '1. What is an OTP?',
        explanation:
          'An OTP (One-Time Password) is a secret number sent by SMS to prove it is really you logging in or authorizing a payment.',
      },
      {
        heading: '2. Who should know your UPI PIN?',
        explanation:
          'Only you. Never tell your UPI PIN or OTP to customers, delivery callers, strangers offering help, or anyone claiming to be bank support.',
      },
      {
        heading: '3. What to do if you suspect fraud',
        explanation:
          'Immediately call India’s national cybercrime helpline 1930 or inform your bank branch right away to freeze suspicious activity.',
      },
    ],
    keyTip: 'Use a strong phone screen lock (PIN or fingerprint) in addition to your UPI PIN for double safety.',
    avoidTip: 'Never write your UPI PIN on the back of your phone cover or on a slip inside your stall.',
  },
];
