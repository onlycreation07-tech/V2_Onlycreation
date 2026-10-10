import { 
  PartnerProfile, 
  PartnerGig, 
  RentalGearItem, 
  StudioBookingSlot, 
  PartnerPayout, 
  TrainingReel, 
  StakeholderRole 
} from '../types/stakeholder';

export const INITIAL_PARTNER_PROFILES: Record<StakeholderRole, PartnerProfile> = {
  reel_creator: {
    id: 'ptr_reel_1',
    name: 'Arjun Sharma',
    role: 'reel_creator',
    phone: '+91 98450 12890',
    email: 'arjun.reels@onlycreation.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    completedJobs: 142,
    activeJobsCount: 2,
    walletBalance: 12450,
    totalEarnings: 218500,
    equipmentSummary: 'iPhone 16 Pro Max • DJI Osmo 6 • Dual Hollyland Mics • Godox LED Pocket',
    city: 'Bangalore (Indiranagar / Koramangala)',
    isVerified: true,
    trainingProgressPct: 85
  },
  videographer: {
    id: 'ptr_video_1',
    name: 'Vikram Malhotra',
    role: 'videographer',
    phone: '+91 97120 54321',
    email: 'vikram.cinematics@onlycreation.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    rating: 5.0,
    completedJobs: 86,
    activeJobsCount: 1,
    walletBalance: 34000,
    totalEarnings: 580000,
    equipmentSummary: 'Sony FX3 Cinema Line • Sony G-Master 24-70mm f2.8 • DJI Ronin RS3 Pro',
    city: 'Bangalore (CBD & Whitefield)',
    isVerified: true,
    trainingProgressPct: 92
  },
  video_editor: {
    id: 'ptr_editor_1',
    name: 'Rohan Das',
    role: 'video_editor',
    phone: '+91 99887 65432',
    email: 'rohan.cuts@onlycreation.io',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    completedJobs: 310,
    activeJobsCount: 3,
    walletBalance: 18600,
    totalEarnings: 395000,
    equipmentSummary: 'DaVinci Resolve Studio 19 • Apple M3 Max • calibrated 4K OLED • 10Gbps Fiber',
    city: 'Remote Workstation (Pan-India Fast Queue)',
    isVerified: true,
    trainingProgressPct: 100
  },
  studio_owner: {
    id: 'ptr_studio_1',
    name: 'The Daylight Loft (Naveen Kumar)',
    role: 'studio_owner',
    phone: '+91 98860 33445',
    email: 'naveen@daylightloft.com',
    avatar: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    rating: 4.8,
    completedJobs: 520,
    activeJobsCount: 4,
    walletBalance: 68500,
    totalEarnings: 1420000,
    equipmentSummary: '1,800 sq.ft Acoustic Stage • 24ft Cyclorama Wall • Profoto B10X • Hair & Makeup Suite',
    city: 'Indiranagar 100ft Road, Bangalore',
    isVerified: true,
    trainingProgressPct: 78
  },
  rental_vendor: {
    id: 'ptr_rental_1',
    name: 'GearFleet Pro Cine (Karthik Raja)',
    role: 'rental_vendor',
    phone: '+91 97412 88990',
    email: 'karthik@gearfleet.in',
    avatar: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    completedJobs: 890,
    activeJobsCount: 14,
    walletBalance: 112000,
    totalEarnings: 2840000,
    equipmentSummary: 'Fleet of 60+ Cinema Cameras, Prime Cine Lenses, Aputure Lighting & Grip Trucks',
    city: 'HSR Layout Sector 4, Bangalore',
    isVerified: true,
    trainingProgressPct: 90
  },
  agency_owner: {
    id: 'ptr_agency_1',
    name: 'Aura Media Studio (Priya Sen)',
    role: 'agency_owner',
    phone: '+91 99001 22334',
    email: 'priya@auramedia.co',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    completedJobs: 95,
    activeJobsCount: 5,
    walletBalance: 185000,
    totalEarnings: 4200000,
    equipmentSummary: 'Turnkey Commercial Agency • Directors, Producers, Colorists & Media Planners',
    city: 'Lavelle Road, Bangalore',
    isVerified: true,
    trainingProgressPct: 95
  }
};

export const INITIAL_PARTNER_GIGS: PartnerGig[] = [
  // 1. Reel Creator Gig (Active - In progress)
  {
    id: 'gig_101',
    title: 'Cafe Espresso Aesthetic Reel Shoot',
    clientName: 'Third Wave Roastery',
    clientHandle: '@thirdwavecoffee',
    location: '12th Main, Indiranagar, Bangalore',
    roleRequired: 'reel_creator',
    payoutAmount: 2400,
    durationHours: 2,
    brief: 'Shoot 3 high-energy aesthetic reels: Barista latte art pour, golden hour pastry rack, customer sipping pour-over with trending audio hooks.',
    status: 'shooting',
    urgency: 'instant',
    createdAt: 'Today, 10:15 AM',
    deadline: 'Today, 2:00 PM',
    acceptedAt: 'Today, 10:20 AM',
    clientNotes: 'Focus on vertical 9:16 framing with 60fps slow-mo for milk pour.'
  },
  // 2. Reel Creator Gig (Available in radar)
  {
    id: 'gig_102',
    title: 'Fitness Gym Launch & Trainer Hook Reel',
    clientName: 'Cult Athletic Club',
    clientHandle: '@cultfit_ind',
    location: 'Koramangala 4th Block (1.2 km away)',
    roleRequired: 'reel_creator',
    payoutAmount: 3200,
    durationHours: 3,
    brief: 'Record trainer workout tips, high-impact kettlebell swings, and quick member testimonial bites.',
    status: 'available',
    urgency: 'instant',
    createdAt: '15 mins ago',
    deadline: 'Today, 5:00 PM',
    clientNotes: 'Bring dual wireless mics for crisp audio during deadlift demo.'
  },
  // 3. Cinema Videographer Gig (Footage uploaded, waiting for editor)
  {
    id: 'gig_103',
    title: 'Luxury EV Scooter Brand Commercial',
    clientName: 'VoltMotors India',
    clientHandle: '@voltmotors',
    location: 'Nandi Hills Sunrise Route, Bangalore',
    roleRequired: 'videographer',
    payoutAmount: 8500,
    durationHours: 5,
    brief: 'Cinema-grade 4K S-Log3 footage of electric scooter navigating hairpin bends at dawn, followed by modern charging dock lifestyle shots.',
    status: 'footage_uploaded',
    urgency: 'scheduled',
    createdAt: 'Yesterday, 4:00 PM',
    deadline: 'Today, 12:00 PM',
    acceptedAt: 'Yesterday, 5:00 PM',
    rawFootageUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-traveling-on-a-highway-at-sunset-41484-large.mp4',
    videographerId: 'ptr_video_1',
    clientNotes: 'Shot on Sony FX3 in 4K 10-bit 4:2:2 S-Log3. Audio captured via Sony XLR handle.'
  },
  // 4. Video Editor & Colorist Gig (Available in Editor Marketplace!)
  {
    id: 'gig_104',
    title: 'Luxury EV Scooter Commercial (Color & Pacing)',
    clientName: 'VoltMotors India',
    clientHandle: '@voltmotors',
    location: 'Remote Workstation Queue',
    roleRequired: 'video_editor',
    payoutAmount: 2500,
    durationHours: 3,
    brief: 'Take the 4K S-Log3 raw footage shot by Vikram Malhotra. Apply cinematic teal/orange film LUT, match speed ramps to electronic beat, and add animated speed HUD metrics.',
    status: 'available',
    urgency: 'express',
    createdAt: '30 mins ago',
    deadline: 'Tonight, 9:00 PM',
    rawFootageUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-traveling-on-a-highway-at-sunset-41484-large.mp4',
    videographerId: 'ptr_video_1',
    clientNotes: 'Deliver 1x 9:16 Instagram Reel cut and 1x 16:9 Youtube Short cut with custom kinetic typography.'
  },
  // 5. Video Editor Gig (In progress)
  {
    id: 'gig_105',
    title: 'Sneaker Unboxing Dynamic Beat Cut',
    clientName: 'SoleSearch India',
    clientHandle: '@solesearch_in',
    location: 'Remote Cloud Queue',
    roleRequired: 'video_editor',
    payoutAmount: 1800,
    durationHours: 2,
    brief: 'Edit fast-cut 30-sec unboxing reel of limited edition Jordan 1s. Whip pans, sound design swooshes, and texture overlays.',
    status: 'editing_in_progress',
    urgency: 'instant',
    createdAt: 'Today, 11:00 AM',
    deadline: 'Today, 6:00 PM',
    acceptedAt: 'Today, 11:30 AM',
    rawFootageUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-showing-a-smartwatch-41584-large.mp4',
    editorId: 'ptr_editor_1',
    clientNotes: 'Keep first 3 seconds extremely fast-paced for retention.'
  },
  // 6. Completed Reel Deliverable
  {
    id: 'gig_106',
    title: 'Artisan Sourdough Bakery Process',
    clientName: 'The Crust Craft',
    clientHandle: '@crustcraft_blr',
    location: 'Defence Colony, Indiranagar',
    roleRequired: 'reel_creator',
    payoutAmount: 2800,
    durationHours: 2,
    brief: 'Baking sourdough from dough scoring to oven bloom. Macro crumb reveal.',
    status: 'completed',
    urgency: 'scheduled',
    createdAt: '2 days ago',
    deadline: 'Yesterday, 6:00 PM',
    acceptedAt: '2 days ago',
    masterVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-kneading-bread-dough-41481-large.mp4',
    clientNotes: '100% approved by client! Payout released to wallet.'
  }
];

export const INITIAL_RENTAL_GEAR: RentalGearItem[] = [
  {
    id: 'gear_01',
    name: 'Sony FX3 Cinema Line Camera Body',
    category: 'camera',
    serialNumber: 'SN-FX3-98214',
    dailyRate: 3500,
    status: 'on_rent',
    borrowerName: 'Vikram Malhotra (Pro Cine)',
    borrowerPhone: '+91 97120 54321',
    rentedDate: '2026-09-21',
    expectedReturnDate: '2026-09-23',
    depositAmount: 25000,
    conditionNotes: 'Brand new sensor, XLR top handle attached',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gear_02',
    name: 'Sony FE 24-70mm f/2.8 GM II Lens',
    category: 'lens',
    serialNumber: 'SN-GM-44102',
    dailyRate: 1500,
    status: 'on_rent',
    borrowerName: 'Vikram Malhotra (Pro Cine)',
    borrowerPhone: '+91 97120 54321',
    rentedDate: '2026-09-21',
    expectedReturnDate: '2026-09-23',
    depositAmount: 15000,
    conditionNotes: 'Includes B+W UV filter and petal hood',
    imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gear_03',
    name: 'Aputure LS 300d II Light with Light Dome III',
    category: 'lighting',
    serialNumber: 'SN-AP300-11029',
    dailyRate: 1800,
    status: 'available',
    depositAmount: 10000,
    conditionNotes: 'All Bowens mount accessories checked & verified',
    imageUrl: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gear_04',
    name: 'DJI RS 3 Pro Gimbal Combo',
    category: 'grip',
    serialNumber: 'SN-RS3P-88219',
    dailyRate: 1400,
    status: 'returned_inspection',
    borrowerName: 'Rahul Varma',
    borrowerPhone: '+91 98451 99882',
    rentedDate: '2026-09-20',
    expectedReturnDate: '2026-09-22',
    actualReturnDate: '2026-09-22',
    depositAmount: 12000,
    conditionNotes: 'Returned at 11am. Physical balancing motors tested okay. Cleaned & repacking.',
    imageUrl: 'https://images.unsplash.com/photo-1589872782415-c64560a4c499?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gear_05',
    name: 'Hollyland Lark Max Wireless Dual Lav Kit',
    category: 'audio',
    serialNumber: 'SN-LARK-55190',
    dailyRate: 800,
    status: 'overdue',
    borrowerName: 'Sanjay Reddy',
    borrowerPhone: '+91 99012 34567',
    rentedDate: '2026-09-19',
    expectedReturnDate: '2026-09-21',
    depositAmount: 8000,
    conditionNotes: 'Client notified via SMS. Expected return delayed by 24h due to outdoor shoot extension.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gear_06',
    name: 'DJI Inspire 3 Cinema Drone System',
    category: 'drone',
    serialNumber: 'SN-INSP3-0012',
    dailyRate: 12000,
    status: 'available',
    depositAmount: 50000,
    conditionNotes: 'DGCA compliant, dual controller setup with master pilot ready',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_STUDIO_BOOKINGS: StudioBookingSlot[] = [
  {
    id: 'slot_301',
    studioName: 'The Daylight Loft',
    stageName: 'Stage A (Cyclorama Wall)',
    clientName: 'Zara Home E-Commerce Shoot',
    clientPhone: '+91 98450 77112',
    date: 'Today, 22 Sep',
    timeSlot: '09:00 AM - 01:00 PM',
    durationHours: 4,
    amount: 14000,
    status: 'in_progress',
    gearIncluded: ['Profoto B10X x3', 'Aputure Nova P300c', 'Hair & Makeup vanity'],
    depositReceived: true
  },
  {
    id: 'slot_302',
    studioName: 'The Daylight Loft',
    stageName: 'Stage B (Acoustic Podcast Pod)',
    clientName: 'Fintech Founders Talk Podcast',
    clientPhone: '+91 97410 88299',
    date: 'Today, 22 Sep',
    timeSlot: '02:30 PM - 05:30 PM',
    durationHours: 3,
    amount: 7500,
    status: 'confirmed',
    gearIncluded: ['Shure SM7B x4', 'Rodecaster Pro II', 'Blackmagic Pocket 6K x2'],
    depositReceived: true
  },
  {
    id: 'slot_303',
    studioName: 'The Daylight Loft',
    stageName: 'Stage A (Cyclorama Wall)',
    clientName: 'Kalyan Jewellers Festive Campaign',
    clientPhone: '+91 99002 11448',
    date: 'Tomorrow, 23 Sep',
    timeSlot: '10:00 AM - 06:00 PM',
    durationHours: 8,
    amount: 28000,
    status: 'confirmed',
    gearIncluded: ['Full Lighting Grid', 'Motorized Turntable', 'Steamer & Wardrobe'],
    depositReceived: true
  }
];

export const INITIAL_PARTNER_PAYOUTS: PartnerPayout[] = [
  {
    id: 'pay_901',
    partnerId: 'ptr_reel_1',
    partnerName: 'Arjun Sharma',
    partnerRole: 'reel_creator',
    amount: 5200,
    upiId: 'arjunsharma@okhdfcbank',
    status: 'paid',
    requestedAt: 'Yesterday, 8:30 PM',
    paidAt: 'Yesterday, 8:45 PM',
    transactionRef: 'UPI-IMPS-8921839218'
  },
  {
    id: 'pay_902',
    partnerId: 'ptr_video_1',
    partnerName: 'Vikram Malhotra',
    partnerRole: 'videographer',
    amount: 17000,
    upiId: 'vikram.cine@icici',
    status: 'approved',
    requestedAt: 'Today, 09:15 AM',
    transactionRef: 'PAY-QUEUE-7712'
  },
  {
    id: 'pay_903',
    partnerId: 'ptr_editor_1',
    partnerName: 'Rohan Das',
    partnerRole: 'video_editor',
    amount: 7200,
    upiId: 'rohandas@paytm',
    status: 'pending',
    requestedAt: 'Today, 11:40 AM'
  }
];

export const STAKEHOLDER_TRAINING_REELS: TrainingReel[] = [
  // 1. Reel Creator Reels
  {
    id: 'tr_reel_1',
    roleCategory: 'reel_creator',
    title: 'The 3-Second Hook Rule for Mobile Reels',
    description: 'How to frame movement in the opening 0-3 seconds to prevent Instagram feed scrolling.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-filming-with-a-smartphone-camera-41589-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    duration: '0:58',
    views: 4820,
    likes: 640,
    difficulty: 'Beginner',
    mentorName: 'Ananya Verma',
    mentorHandle: '@ananya_viralcuts',
    mentorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Start mid-action rather than introducing yourself',
      'Lock focus and expose -0.3 EV for richer mobile contrast',
      'Use natural foreground wipes to transition between cuts'
    ],
    completed: true
  },
  {
    id: 'tr_reel_2',
    roleCategory: 'reel_creator',
    title: 'Dual Lighting Setup with Pocket LEDs',
    description: 'Transform dark restaurant or cafe shoots using a 60W bi-color key and a warm magnetic backlight.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-coffee-art-in-a-cafe-41558-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    duration: '1:15',
    views: 3290,
    likes: 410,
    difficulty: 'Intermediate',
    mentorName: 'Kabir Mehta',
    mentorHandle: '@kabir_lightinglab',
    mentorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Place the key light 45 degrees off-camera opposite the natural window',
      'Never point raw LED diodes directly at glossy food or drink',
      'Use parchment paper as a quick diffuser if you lack a softbox'
    ],
    completed: false
  },

  // 2. Cinema Videographer Reels
  {
    id: 'tr_video_1',
    roleCategory: 'videographer',
    title: 'Exposing S-Log3 on Sony FX3 Perfectly',
    description: 'Why zebra metering at 94% on white and +1.7 EV on grey cards gives noise-free shadow detail.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cameraman-recording-in-a-film-studio-41487-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    duration: '1:42',
    views: 7120,
    likes: 920,
    difficulty: 'Pro',
    mentorName: 'Devraj Kapoor (DoP)',
    mentorHandle: '@devraj_cinematics',
    mentorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Base ISO is 800 and 12,800 on the FX3; stay strictly at these dual native points',
      'Use variable ND to maintain 180-degree shutter (1/50 at 24fps or 1/120 at 60fps)',
      'Upload 1080p proxy clips to the cloud while shooting so editors can start immediately'
    ],
    completed: true
  },
  {
    id: 'tr_video_2',
    roleCategory: 'videographer',
    title: 'Ronin RS3 Pro Motor Tuning for Heavy Glass',
    description: 'Auto-tune algorithms, balance offsets, and briefcase mode transitions for 24-70 GM zoom tracking.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-traveling-on-a-highway-at-sunset-41484-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
    duration: '1:08',
    views: 5400,
    likes: 670,
    difficulty: 'Intermediate',
    mentorName: 'Samir Joshi',
    mentorHandle: '@samir_gimbaltech',
    mentorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Always lock vertical tilt balance with zoom lens extended to its longest focal length',
      'Use SuperSmooth mode when tracking vehicle runs over 30 km/h',
      'Calibrate LiDAR focus points before client talent steps onto the set'
    ],
    completed: false
  },

  // 3. Video Editor Reels
  {
    id: 'tr_editor_1',
    roleCategory: 'video_editor',
    title: 'DaVinci Resolve Node Tree for Commercials',
    description: 'Clean CST (Color Space Transform) pipeline from Sony S-Gamut3.Cine into Rec.709 with skin tone isolation.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-laptop-keyboard-with-neon-lights-41585-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    duration: '1:30',
    views: 9340,
    likes: 1240,
    difficulty: 'Pro',
    mentorName: 'Ritika Roy (Senior Colorist)',
    mentorHandle: '@ritika_colorgrade',
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Node 1: Exposure Balance -> Node 2: White Balance -> Node 3: CST In -> Node 4: Creative Look -> Node 5: CST Out',
      'Always verify skin tones against the vectorscope 45-degree indicator line',
      'Export with Gamma 2.4 for Instagram & YouTube to avoid washed-out iOS display shifting'
    ],
    completed: true
  },
  {
    id: 'tr_editor_2',
    roleCategory: 'video_editor',
    title: 'Sound Design That Hooks 90% More Viewers',
    description: 'Layering low-end sub drops, swoosh risers, and tactile Foley clicks for viral short-form retention.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-showing-a-smartwatch-41584-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&auto=format&fit=crop&q=80',
    duration: '1:05',
    views: 6180,
    likes: 890,
    difficulty: 'Beginner',
    mentorName: 'Aman Khan',
    mentorHandle: '@aman_audioedits',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Side-chain duck the background music by -4.5dB whenever voiceover dialogue occurs',
      'Add a subtle paper-rustle or mechanical switch click on every text card animation',
      'EQ out muddy frequencies below 80Hz on voice tracks using a high-pass filter'
    ],
    completed: false
  },

  // 4. Studio Space Owner Reels
  {
    id: 'tr_studio_1',
    roleCategory: 'studio_owner',
    title: 'Acoustic Soundproofing Secrets for Commercial Stages',
    description: 'How decoupling wall baffles and ceiling cloud bass traps eliminate Bangalore traffic rumble.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sound-engineer-at-recording-studio-console-41488-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=80',
    duration: '1:24',
    views: 2890,
    likes: 380,
    difficulty: 'Intermediate',
    mentorName: 'Muralidhar Rao (Studio Architect)',
    mentorHandle: '@murali_acoustics',
    mentorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Double 5/8 drywall with Green Glue damping compound stops low frequency sub bass',
      'Never mount AC compressors directly to ceiling joists; use vibration springs',
      'Install automatic drop-down door seals at the bottom of soundstage entrance doors'
    ],
    completed: true
  },
  {
    id: 'tr_studio_2',
    roleCategory: 'studio_owner',
    title: 'Cyclorama Wall Maintenance & Fast Floor Scuff Repair',
    description: 'Fast drying ultra-matte white floor rolling techniques between back-to-back 4-hour fashion bookings.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-a-studio-setting-41482-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500&auto=format&fit=crop&q=80',
    duration: '0:55',
    views: 3120,
    likes: 420,
    difficulty: 'Beginner',
    mentorName: 'Radhika Nair',
    mentorHandle: '@radhika_studiomanager',
    mentorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Mandate blue surgical booties for all crew members stepping onto the curve',
      'Keep pre-mixed flat white quick-dry vinyl paint in an electric paint sprayer',
      'Maintain an infrared heater to cure fresh floor paint in under 15 minutes'
    ],
    completed: false
  },

  // 5. Camera & Rental Vendor Reels
  {
    id: 'tr_rental_1',
    roleCategory: 'rental_vendor',
    title: 'Cinema Sensor Inspection & Dust Cleaning Protocol',
    description: 'Swab techniques, static brush safety, and laser spot checks for returned FX3 and RED sensors.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-video-camera-lens-close-up-in-dim-light-41586-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
    duration: '1:18',
    views: 4150,
    likes: 560,
    difficulty: 'Pro',
    mentorName: 'Vinod Chandran',
    mentorHandle: '@vinod_cameraworks',
    mentorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Take a 3-second reference photo of a plain white wall at f/22 before handing gear over',
      'Never blow mouth air or use uncalibrated air compressors near an open sensor cavity',
      'Use digital intake condition stamps to prevent damage deposit disputes'
    ],
    completed: true
  },
  {
    id: 'tr_rental_2',
    roleCategory: 'rental_vendor',
    title: 'Pelican Case Transit Shock Packing Standards',
    description: 'Custom foam pluck layouts, lens barrel spacers, and humidity desiccant placement for Bangalore courier transit.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-showing-a-smartwatch-41584-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=500&auto=format&fit=crop&q=80',
    duration: '1:02',
    views: 2980,
    likes: 390,
    difficulty: 'Beginner',
    mentorName: 'Karthik Raja',
    mentorHandle: '@gearfleet_in',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Leave at least 1.5 inches of high-density EVA foam between any two heavy lenses',
      'Keep heavy Cine V-Mount batteries in fire-retardant individual pouches during courier movement',
      'Install live GPS tag inside the Pelican lid lining for real-time asset telemetry'
    ],
    completed: false
  },

  // 6. Agency Owner Reels
  {
    id: 'tr_agency_1',
    roleCategory: 'agency_owner',
    title: 'Structuring 6-Figure Retainer Contracts with D2C Brands',
    description: 'How to bundle monthly reel shoots, high-ticket commercials, and ad-variant edits into recurring contracts.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-laptop-keyboard-with-neon-lights-41585-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    duration: '1:45',
    views: 8900,
    likes: 1150,
    difficulty: 'Pro',
    mentorName: 'Priya Sen',
    mentorHandle: '@priya_auramedia',
    mentorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    proTips: [
      'Price by deliverable value and ROAS impact, never by hourly creator rate',
      'Include 2 included revision rounds with a strict 48-hour client review clause',
      'Keep 20% milestone escrow upfront before deploying crew onto location sets'
    ],
    completed: true
  }
];
