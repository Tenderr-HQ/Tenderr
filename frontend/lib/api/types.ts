/**
 * types.ts
 *
 * Hand-written TypeScript mirrors of every Django serializer.
 * If a backend serializer changes, update this file FIRST —
 * every other file imports from here, so TypeScript will
 * show you exactly where the frontend needs updating.
 *
 * Naming convention:
 *   XxxDto       — a single object returned by the API
 *   XxxListDto   — a paginated list ({count, next, previous, results})
 *   XxxPayload   — a request body sent to the API
 */

// ────────────────────────────────────────────────────────────
// Shared
// ────────────────────────────────────────────────────────────

/** Standard DRF pagination envelope. Every list endpoint uses this. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Masked author info. Returned by posts, comments, letters.
 * `type` tells the UI how to render the chip:
 *   - "anonymous" → mask icon, "Anonymous", not clickable
 *   - "private"   → display name only, not clickable
 *   - "public"    → avatar + username, clickable → /profile/<username>
 */
export interface AuthorInfo {
  type: 'anonymous' | 'private' | 'public' | 'system';
  display: string;
  clickable: boolean;
  username: string | null;
  avatar_url: string | null;
  is_admin?: boolean;
}

/** Every authenticated API call returns the current user in this shape. */
export interface UserDto {
  id: string;
  email: string;
  username: string;
  display_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string;
  is_verified_admin: boolean;
  is_profile_private: boolean;
  date_joined: string;
  last_active: string | null;
}

export interface PublicUserDto {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_verified_admin: boolean;
  is_private: boolean;
  // Viewer-aware flags (present only when logged in)
  standing_with?: boolean;
  companion_status?: {
    id: number;
    status: 'pending' | 'accepted' | 'declined';
    initiated_by_me: boolean;
  } | null;
  blocked_by_me?: boolean;
  has_blocked_me?: boolean;
}

// ────────────────────────────────────────────────────────────
// Authentication (authentications/urls.py)
// ────────────────────────────────────────────────────────────



export interface RegisterPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}



export interface LoginPayload {
  email: string;
  password: string;
}

export interface OAuthPayload {
  provider: 'google' | 'apple';
  id_token: string;
}

/** Returned by register, login, and oauth. */
export interface TokenPair {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    full_name: string;
    is_verified_admin: boolean;
    is_profile_private: boolean;
  };
  email_verification_required?: boolean;
}

// ────────────────────────────────────────────────────────────
// Accounts (accounts/urls.py)
// ────────────────────────────────────────────────────────────

export interface MeDto {
  id: string;
  email: string;
  username: string;
  display_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string;
  is_profile_private: boolean;
  is_verified_admin: boolean;
  is_staff: boolean;
  accepts_companion_requests: boolean;
  pending_companion_requests_count: number;
  date_joined: string;
  last_active: string | null;
  last_login: string | null;
}

export interface UpdateProfilePayload {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

export interface AvatarHistoryItem {
  id: string;
  url: string | null;
  size_bytes: number;
  width: number;
  height: number;
  is_current: boolean;
  created_at: string;
}

export interface SessionItem {
  id: string;
  ip: string | null;
  user_agent: string;
  created_at: string;
  ended_at: string | null;
}

export interface StandWithItem {
  id: number;
  target: PublicUserDto;
  created_at: string;
}

export interface CompanionItem {
  id: number;
  status: 'pending' | 'accepted' | 'declined';
  initiated_by_me: boolean;
  peer: PublicUserDto;
  created_at: string;
  responded_at: string | null;
}

export interface BlockItem {
  id: number;
  blocked: PublicUserDto;
  created_at: string;
}

export interface DeactivatePayload {
  reason?: string;
}

// ────────────────────────────────────────────────────────────
// Posts (posts/urls.py)
// ────────────────────────────────────────────────────────────

export type PostCategory = 'love' | 'life' | 'mental_health' | 'family';
export type PostIntent = 'vent' | 'advice' | 'similar' | 'talk';
export type ReactionType = 'love' | 'me_too';

export interface ReactionSummary {
  love: number;
  me_too: number;
  mine: ReactionType[];
}

export interface PostDto {
  id: string;
  content: string;
  category: PostCategory;
  intent: PostIntent;
  allow_comments: boolean;
  is_anonymous: boolean;
  author_info: AuthorInfo;
  reactions: ReactionSummary;
  comments_count: number | null; // null when comments are disabled
  letters_count: number;         // 0 for non-authors
  is_mine: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostPayload {
  content: string;
  category: PostCategory;
  intent: PostIntent;
  allow_comments: boolean;
  is_anonymous: boolean;
}

export interface CommentDto {
  id: string;
  post: string;
  parent: string | null;
  content: string;
  is_anonymous: boolean;
  author_info: AuthorInfo;
  is_op: boolean;
  replies_count: number;
  can_reply: boolean;
  created_at: string;
}

export interface CreateCommentPayload {
  content: string;
  parent?: string | null;
  is_anonymous: boolean;
}

export interface LetterDto {
  id: string;
  content: string;
  is_sender_anonymous: boolean;
  sender_info: AuthorInfo;
  post_preview: { id: string; snippet: string };
  is_read: boolean;
  created_at: string;
}

export interface SendLetterPayload {
  content: string;
  is_sender_anonymous: boolean;
}

// ────────────────────────────────────────────────────────────
// Communities (communities/urls.py)
// ────────────────────────────────────────────────────────────

export interface CommunityDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string | null;
  is_official: boolean;
  member_count: number;
  post_count: number;
  is_member: boolean;
  created_at: string;
}

export interface CommunityDetailDto extends CommunityDto {
  admins: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>;
}

export interface MembershipDto {
  id: number;
  community: CommunityDto;
  source: 'organic' | 'invite' | 'admin';
  joined_at: string;
}

export type MediaType = 'none' | 'image' | 'video';

export interface CommunityPostDto {
  id: string;
  community: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: MediaType;
  is_admin_post: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  is_anonymous: boolean;
  author_info: AuthorInfo;
  comments_disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityPostPayload {
  title: string;
  content: string;
  media?: File | null;
  is_anonymous: boolean;
}

export interface DiscussionDto {
  id: string;
  community: string;
  title: string;
  description: string;
  is_sensitive: boolean;
  is_archived: boolean;
  status: 'open' | 'closed';
  close_at: string;
  is_active: boolean;
  seconds_remaining: number;
  admin_info: AuthorInfo;
  message_count: number;
  created_at: string;
}

export interface CreateDiscussionPayload {
  title: string;
  description: string;
  is_sensitive: boolean;
  close_at: string; // ISO datetime
}

export interface DiscussionMessageDto {
  id: string;
  discussion: string;
  content: string;
  is_anonymous: boolean;
  author_info: AuthorInfo;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Moderation (moderation/urls.py)
// ────────────────────────────────────────────────────────────

export type ContentType = 'post' | 'comment' | 'message' | 'user';
export type ReportReason =
  | 'harassment' | 'hate' | 'self_harm' | 'violence'
  | 'spam' | 'misinformation' | 'other';
export type Severity = 'low' | 'medium' | 'critical';
export type ContentStatus = 'approved' | 'flagged' | 'removed';

export interface ReportPayload {
  content_type: ContentType;
  object_id: string;
  reason: ReportReason;
  details?: string;
}

export interface ReportDto {
  id: string;
  content_type: ContentType;
  object_id: string;
  content_preview: string | null;
  reason: ReportReason;
  details: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string;
  created_at: string;
}

export interface ModerationFlagDto {
  id: string;
  content_type: ContentType;
  object_id: string;
  content_preview: string | null;
  severity: Severity;
  severity_label: string;
  reason: string;
  score: number | null;
  source: 'perspective' | 'crisis_keyword' | 'manual';
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Settings (settings/urls.py)
// ────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type LanguageCode = 'ar' | 'en' | 'es' | 'fr' | 'pt' | 'sw';

export interface AccountSettingsDto {
  email: string;
  username: string;
  display_name: string;
  full_name: string;
  auth_provider: 'email' | 'google' | 'apple';
  is_verified: boolean;
  date_joined: string;
  last_active: string | null;
}

export interface PrivacySettingsDto {
  is_profile_private: boolean;
  show_in_search: boolean;
  allow_profile_views: boolean;
}

export interface SecuritySettingsDto {
  two_factor_enabled: boolean;
  login_alerts: boolean;
}

export interface AppearanceSettingsDto {
  theme: Theme;
  reduce_motion: boolean;
  font_size: FontSize;
}

export interface LanguageSettingsDto {
  language: LanguageCode;
}

export interface DataStorageSettingsDto {
  auto_save_drafts: boolean;
  keep_anonymous_history: boolean;
  export_requested_at: string | null;
  delete_scheduled_at: string | null;
}

export interface NotificationSettingsDto {
  email_comments: boolean;
  email_letters: boolean;
  email_digest: boolean;
  push_comments: boolean;
  push_letters: boolean;
}

export interface HelpSupportDto {
  support_email: string;
  faq_url: string;
  terms_url: string;
  privacy_url: string;
  crisis_resources: Array<{
    region: string;
    name: string;
    phone: string;
    url: string;
  }>;
}

// ────────────────────────────────────────────────────────────
// Notifications (notifications/urls.py)
// ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'comment' | 'reaction' | 'letter'
  | 'discussion' | 'moderation' | 'system';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  masked_title: string;
  body: string;
  link: string;
  actor_info: AuthorInfo;
  target_is_anonymous: boolean;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountDto {
  count: number;
}