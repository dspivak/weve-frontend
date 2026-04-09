const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SignupPayload = {
  email: string;
  password: string;
  full_name: string;
  username: string;
  zip_code?: string | null;
  phone?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio?: string | null;
  avatar_url?: string | null;
  contributions_count?: number;
  collaborations_count?: number;
};

/** Storage keys for auth (moved to top for consistency) */
export const USER_STORAGE_KEY = "weve_user";
export const TOKEN_STORAGE_KEY = "weve_token";
export const REFRESH_TOKEN_STORAGE_KEY = "weve_refresh_token";

/** Clear all auth data from local storage */
export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Get stored access token. Returns null if not in browser or not set. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Get stored refresh token. */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Helper to handle 401/403 and refresh token automatically */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, try to refresh
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await refreshAuth(refreshToken);
        if (refreshRes && refreshRes.access_token) {
          // Store new tokens
          window.localStorage.setItem(TOKEN_STORAGE_KEY, refreshRes.access_token);
          if (refreshRes.refresh_token) {
            window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshRes.refresh_token);
          }

          // Retry original request with new token
          headers.set("Authorization", `Bearer ${refreshRes.access_token}`);
          return fetch(url, { ...options, headers });
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }

    // If we reach here, refresh failed or no refresh token - clear auth and let caller handle
    clearAuth();
    // Redirect if in dashboard
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      window.location.href = "/login?expired=1";
    }
  }

  return res;
}

export type SignupSuccessResponse = {
  message: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  user: UserProfile;
};

export async function signup(payload: SignupPayload): Promise<SignupSuccessResponse> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.detail) ? data.detail.map((d: { msg?: string }) => d.msg ?? "").join(", ") : (data.detail ?? "Signup failed");
    throw new Error(typeof msg === "string" ? msg : "Signup failed");
  }
  return data;
}

export type LoginError = { message: string; code?: string };

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    if (detail && typeof detail === "object" && "code" in detail) {
      const err: LoginError = {
        message: typeof detail.message === "string" ? detail.message : "Please verify your email before logging in.",
        code: typeof detail.code === "string" ? detail.code : undefined,
      };
      throw err;
    }
    const msg = Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg ?? "").join(", ") : (detail ?? "Login failed");
    throw { message: typeof msg === "string" ? msg : "Login failed" } as LoginError;
  }
  return data;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : "Failed to resend verification email.";
    throw new Error(msg);
  }
}

export async function updateProfile(
  accessToken: string,
  payload: { full_name?: string | null; bio?: string | null; avatar_url?: string | null }
): Promise<UserProfile> {
  const res = await fetchWithAuth(`${API_BASE}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`, // explicitly passed token is still honored
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to update profile";
    throw new Error(msg);
  }
  return data as UserProfile;
}

/** Exchange refresh token for new access token and user. Returns null on failure. */
export async function refreshAuth(refreshToken: string): Promise<TokenResponse | null> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (res.status === 401 || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return data as TokenResponse;
}


/** Validate token and get current user. Returns null if not authenticated or token invalid. */
export async function getMe(accessToken: string): Promise<UserProfile | null> {
  const res = await fetchWithAuth(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data as UserProfile;
}

export async function getProfileByUserId(accessToken: string, userId: string): Promise<UserProfile | null> {
  const res = await fetchWithAuth(`${API_BASE}/api/auth/profile/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data as UserProfile;
}

/** Plausible Fiction: generate post from prompt (refine prompt + generate content). content is null when prompt was invalid (only refined idea / apology shown). */
export type PFGenerateResponse = {
  refined_prompt: string;
  content: string | null;
};

export async function generatePlausibleFiction(
  prompt: string
): Promise<PFGenerateResponse> {
  const res = await fetch(`${API_BASE}/api/pf/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : "Failed to generate post. Try again.";
    throw new Error(msg);
  }
  return data as PFGenerateResponse;
}

/** Plausible Fiction: modify existing post based on user instruction. */
export type PFModifyResponse = { content: string };

export async function modifyPlausibleFiction(
  currentContent: string,
  userMessage: string
): Promise<PFModifyResponse> {
  const res = await fetch(`${API_BASE}/api/pf/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_content: currentContent.trim(),
      user_message: userMessage.trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : "Failed to update post. Try again.";
    throw new Error(msg);
  }
  return data as PFModifyResponse;
}

/** Generate an image from post content (DALL-E 3). Returns temporary URL. */
export async function generatePostImage(postContent: string): Promise<{ image_url: string }> {
  const res = await fetch(`${API_BASE}/api/pf/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_content: postContent.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to generate image.";
    throw new Error(msg);
  }
  return data as { image_url: string };
}

// --- Posts (auth required) ---

export type PostAuthorResponse = { id: string; full_name: string; username: string };

export type PostResponse = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  image_url: string | null;
  collaboration_parent_id?: string | null;
  collaboration_task_id?: string | null;
  like_count?: number;
  collaboration_count?: number;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
  author?: PostAuthorResponse | null;
};

export type PostListResponse = { posts: PostResponse[]; total?: number };

export async function createPost(
  accessToken: string,
  payload: {
    title?: string | null;
    content: string;
    status?: "draft" | "published";
    image_url?: string | null;
    collaboration_parent_id?: string | null;
    collaboration_task_id?: string | null;
  }
): Promise<PostResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title: payload.title ?? null,
      content: payload.content,
      status: payload.status ?? "draft",
      image_url: payload.image_url ?? null,
      collaboration_parent_id: payload.collaboration_parent_id ?? null,
      collaboration_task_id: payload.collaboration_task_id ?? null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to create post.";
    throw new Error(msg);
  }
  return data as PostResponse;
}

export async function publishPost(accessToken: string, postId: string): Promise<PostResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/${postId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to publish post.";
    throw new Error(msg);
  }
  return data as PostResponse;
}

/** Fetch published posts for the feed. Auth required. */
export async function getPost(accessToken: string, postId: string): Promise<PostResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/${postId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to load post.";
    throw new Error(msg);
  }
  return data as PostResponse;
}

export async function getPosts(
  accessToken: string,
  statusFilter?: "published" | "draft",
  authorUsername?: string,
  tabFilter?: "posts" | "contributions",
  page: number = 1,
  limit: number = 20
): Promise<PostListResponse> {
  let url = `${API_BASE}/api/posts`;
  const params = new URLSearchParams();
  if (statusFilter) params.append("status_filter", statusFilter);
  if (authorUsername) params.append("author_username", authorUsername);
  if (tabFilter) params.append("tab_filter", tabFilter);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetchWithAuth(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch posts");
  }
  return data as PostListResponse;
}

/** Fetch current user's posts. Auth required. */
export async function listMyPosts(accessToken: string): Promise<PostListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/my-posts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch my posts");
  }
  return data as PostListResponse;
}

export async function getUserSavedPosts(accessToken: string): Promise<PostListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/saved`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch saved posts");
  }
  return data as PostListResponse;
}

export async function getUserCollaboratedPosts(accessToken: string, username: string): Promise<PostListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/collaborated/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch collaborated posts");
  }
  return data as PostListResponse;
}

/** Get collaborations (replies/quotes) for a post */
export async function getCollaborations(accessToken: string, postId: string): Promise<PostListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts?status_filter=published&collaboration_parent_id=eq.${postId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to load collaborations.";
    throw new Error(msg);
  }
  return data as PostListResponse;
}

// Toggle like on a post. Returns new like count and liked flag.
export async function togglePostLike(accessToken: string, postId: string): Promise<{ post_id: string; liked: boolean; like_count: number }> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/${postId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Unable to like post.";
    throw new Error(msg);
  }
  return data as { post_id: string; liked: boolean; like_count: number };
}

// Toggle save/favorite on a post.
export async function togglePostSave(accessToken: string, postId: string): Promise<{ post_id: string; saved: boolean }> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/${postId}/save`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Unable to save post.";
    throw new Error(msg);
  }
  return data as { post_id: string; saved: boolean };
}

// Get list of users who liked a post.
export async function getPostLikes(accessToken: string, postId: string): Promise<{ post_id: string; likes: PostAuthorResponse[] }> {
  const res = await fetchWithAuth(`${API_BASE}/api/posts/${postId}/likes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Unable to load likes.";
    throw new Error(msg);
  }
  return data as { post_id: string; likes: PostAuthorResponse[] };
}
// --- Notifications (auth required) ---

export type NotificationActor = { id: string; full_name: string; username: string };
export type NotificationPost = { id: string; content: string };

export type NotificationResponse = {
  id: string;
  user_id: string;
  actor: NotificationActor;
  post?: NotificationPost | null;
  type: "post_liked" | "post_saved";
  is_read: boolean;
  created_at: string;
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
  total: number;
  unread_count: number;
};

export async function getNotifications(accessToken: string): Promise<NotificationListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.detail === "string" ? data.detail : "Failed to load notifications.";
    throw new Error(msg);
  }
  return data as NotificationListResponse;
}

export async function markNotificationAsRead(accessToken: string, notificationId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to mark notification as read.");
}

export async function markAllNotificationsAsRead(accessToken: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to mark all notifications as read.");
}

export async function deleteNotification(accessToken: string, notificationId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/notifications/${notificationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to delete notification.");
}

// --- Chat (auth required) ---

export type ChatParticipant = {
  id: string;
  full_name: string;
  username: string;
};

export type MessageResponse = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  post_id?: string | null;
  created_at: string;
};

export type ConversationResponse = {
  id: string;
  participant: ChatParticipant;
  last_message?: string | null;
  last_at?: string | null;
  unread_count: number;
};

export type ConversationListResponse = {
  conversations: ConversationResponse[];
};

export type MessageListResponse = {
  messages: MessageResponse[];
};

export async function getConversations(accessToken: string): Promise<ConversationListResponse> {
  const url = `${API_BASE}/api/chat/conversations`;
  const res = await fetchWithAuth(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to load conversations.");
  return data as ConversationListResponse;
}

export async function getConversationMessages(accessToken: string, conversationId: string): Promise<MessageListResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to load messages.");
  return data as MessageListResponse;
}

export async function sendMessage(
  accessToken: string,
  req: { recipient_id: string; content: string; post_id?: string | null }
): Promise<MessageResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/chat/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to send message.");
  return data as MessageResponse;
}

export async function checkExistingConversation(accessToken: string, otherUserId: string): Promise<{ exists: boolean; id: string | null }> {
  const res = await fetchWithAuth(`${API_BASE}/api/chat/conversations/check?other_user_id=${otherUserId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to check conversation.");
  return data as { exists: boolean; id: string | null };
}

export async function markConversationAsRead(accessToken: string, conversationId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to mark conversation as read.");
}
