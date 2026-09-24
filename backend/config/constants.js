// Application Constants

export const USER_ROLES = {
  USER: 'user',
  SCRAPPER: 'scrapper',
  ADMIN: 'admin'
};

export const SCRAPPER_TYPES = {
  FERI_WALA: 'feri_wala',
  DUKANDAAR: 'dukandaar',
  WHOLESALER: 'wholesaler',
  // Legacy types (backward compatibility)
  SMALL: 'small',
  BIG: 'big'
};

export const VEHICLE_TYPES = {
  CYCLE: 'cycle',
  THELA: 'thela',
  E_RICKSHAW: 'e_rickshaw',
  TEMPO: 'tempo',
  BIKE: 'bike',
  AUTO: 'auto',
  TRUCK: 'truck'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',     // Accepted
  ON_WAY: 'on_way',           // Scrapper started journey
  ARRIVED: 'arrived',         // Scrapper arrived at location
  IN_PROGRESS: 'in_progress', // Picking up scrap
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const SCRAP_CATEGORIES = {
  METAL: 'metal',
  PLASTIC: 'plastic',
  PAPER: 'paper',
  ELECTRONIC: 'electronic',
  GLASS: 'glass',
  OTHER: 'other',
  E_WASTE: 'e_waste',
  SCRAP_IRON: 'scrap_iron',
  RADDI: 'raddi',
  FURNITURE: 'furniture',
  VEHICLE_SCRAP: 'vehicle_scrap',
  HOME_APPLIANCE: 'home_appliance'
};

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 1000
};

export const ORDER_TYPES = {
  SCRAP_SELL: 'scrap_sell'
};

export const PRICE_TYPES = {
  MATERIAL: 'material'
};

export const PRICING_TYPES = {
  KG_BASED: 'kg_based',
  NEGOTIABLE: 'negotiable'
};

export const ITEM_CONDITIONS = {
  GOOD: 'good',
  AVERAGE: 'average',
  DAMAGED: 'damaged'
};

// Categories that default to negotiable pricing (per-item, not per-kg)
export const NEGOTIABLE_CATEGORIES = [
  'furniture',
  'vehicle_scrap',
  'home_appliance',
  'e_waste'
];

export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  PROMOTION: 'promotion'
};
