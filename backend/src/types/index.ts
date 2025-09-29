import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Pagination query parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'ADMIN' | 'REP' | 'READ_ONLY';
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Merchant types
export interface MerchantCreateRequest {
  merchantName: string;
  legalName?: string;
  brandAliases?: string[];
  category: string;
  genre?: string;
  pricingTier?: string;
  studentFit?: string;
  city: string;
  neighborhood?: string;
  exactAddress?: string;
  googleMapsLink?: string;
  lat?: number;
  lng?: number;
  numBranches?: number;
  deliveryAvailable?: boolean;
  dineIn?: boolean;
  takeAway?: boolean;
  openingHours?: string;
  busyHours?: string;
  ownerPartner?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  phoneMain?: string;
  whatsappBusiness?: string;
  emailMain?: string;
  registerNumber?: string;
  taxNumber?: string;
  kycStatus?: string;
  riskLevel?: string;
  contractRequired?: boolean;
  contractVersion?: string;
}

export interface MerchantUpdateRequest extends Partial<MerchantCreateRequest> {
  id?: never; // Prevent ID updates
}

export interface MerchantFilterQuery extends PaginationQuery {
  category?: string;
  stage?: string;
  city?: string;
  studentFit?: string;
  pricingTier?: string;
  rep?: string;
  isLive?: string;
}

// Pipeline types
export interface PipelineTransitionRequest {
  newStage: string;
  lostReason?: string;
  nextAction?: string;
  nextActionDue?: string;
}

export interface PipelineUpdateRequest {
  nextAction?: string;
  nextActionDue?: string;
  responsibleRepId?: string;
}

// Onboarding types
export interface OnboardingUpdateRequest {
  contactName?: string;
  contactNumber?: string;
  locationLabel?: string;
  surveyFilled?: boolean;
  teenStaffInstalled?: boolean;
  credentialsSent?: boolean;
  trainingDone?: boolean;
  offersAdded?: boolean;
  offersCount?: number;
  branchesCovered?: boolean;
  assetsComplete?: boolean;
  readyForQa?: boolean;
  qaNotes?: string;
}

// Activity types
export interface ActivityCreateRequest {
  merchantId: string;
  type: string;
  summary: string;
  occurredAt?: string;
  attachmentUrl?: string;
}

export interface ActivityUpdateRequest extends Partial<ActivityCreateRequest> {
  merchantId?: never; // Prevent merchant changes
}

export interface ActivityFilterQuery extends PaginationQuery {
  merchantId?: string;
  type?: string;
  repId?: string;
  fromDate?: string;
  toDate?: string;
}

// Asset types
export interface AssetUpdateRequest {
  logoUrl?: string;
  bannerUrl?: string;
  descriptionText?: string;
  appCategoryTags?: string[];
  mapAddress?: string;
  mapLink?: string;
}

// Contact types
export interface ContactCreateRequest {
  merchantId: string;
  name: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  preferredChannel?: string;
  notes?: string;
}

export interface ContactUpdateRequest extends Partial<ContactCreateRequest> {
  merchantId?: never;
}

// Offer types
export interface OfferCreateRequest {
  merchantId: string;
  title: string;
  offerType: string;
  status?: string;
}

export interface OfferUpdateRequest extends Partial<OfferCreateRequest> {
  merchantId?: never;
}

// Dashboard types
export interface DashboardQuery {
  period?: 'week' | 'month' | 'quarter' | 'year';
  repId?: string;
}

export interface DashboardMetrics {
  totalMerchants: number;
  liveMerchants: number;
  conversionRate: number;
  totalPayouts: number;
  pipelineBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  repPerformance: RepPerformance[];
  onboardingMetrics: OnboardingMetrics;
}

export interface RepPerformance {
  repId: string;
  repName: string;
  totalMerchants: number;
  wonMerchants: number;
  liveMerchants: number;
  totalEarnings: number;
  conversionRate: number;
  activitiesCount: number;
}

export interface OnboardingMetrics {
  total: number;
  completed: number;
  inProgress: number;
  avgCompletionDays: number;
  stepCompletion: Record<string, number>;
}

// Export types
export interface ExportQuery {
  type: 'merchants' | 'pipeline' | 'activities' | 'payouts' | 'onboarding';
  format?: 'csv' | 'json';
  fromDate?: string;
  toDate?: string;
  repId?: string;
  stage?: string;
  category?: string;
}

// File upload types
export interface FileUploadRequest {
  merchantId: string;
  type: 'logo' | 'banner' | 'document';
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Email types
export interface EmailTemplate {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  variables?: Record<string, string>;
}

// Audit types
export interface AuditLogEntry {
  userId?: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE';
  changes?: any;
}

// Business logic types
export interface PipelineTransitionResult {
  success: boolean;
  pipeline: any;
  payoutCreated?: boolean;
  onboardingCreated?: boolean;
}

export interface OnboardingLiveResult {
  success: boolean;
  onboarding: any;
  merchant: any;
  payoutCreated?: boolean;
}

// Filter and search types
export interface SearchQuery {
  q: string;
  fields?: string[];
  limit?: number;
}

export interface FilterOptions {
  [key: string]: string | string[] | number | boolean | undefined;
}

// Statistics types
export interface StatisticsQuery {
  fromDate?: string;
  toDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  repId?: string;
  category?: string;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: any;
}

// Notification types
export interface NotificationRequest {
  type: string;
  entityId: string;
  recipient: string;
  subject?: string;
  message: string;
}

// Import/Export types
export interface ImportResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface CSVImportOptions {
  skipFirstRow?: boolean;
  fieldMapping?: Record<string, string>;
  validateOnly?: boolean;
}

// Cache types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

// Database transaction types
export type TransactionCallback<T> = (tx: any) => Promise<T>;

// Middleware types
export interface MiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
}

export type AsyncHandler = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => Promise<any>;

// Re-export Prisma types
export type {
  User,
  Merchant,
  Pipeline,
  Onboarding,
  Activity,
  Contact,
  Asset,
  Offer,
  PayoutLedger,
  AuditLog,
  Setting,
  Notification,
  Role,
  UserStatus,
  MerchantCategory,
  PricingTier,
  StudentFit,
  KycStatus,
  RiskLevel,
  ContractStatus,
  PipelineStage,
  ActivityType,
  ContactRole,
  ContactChannel,
  OfferType,
  OfferStatus,
  PayoutReason,
  AuditAction,
  NotificationType
} from '@prisma/client';