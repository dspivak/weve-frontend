"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/dashboard/PostCard";
import { Button } from "@/components/ui/button";
import {
  getMe,
  getPosts,
  getUserSavedPosts,
  getUserCollaboratedPosts,
  updateProfile,
  type UserProfile,
  type PostResponse,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { mapApiPostToPost } from "@/lib/postUtils";
import { Loader2, Camera, Edit2, Info, User, AlignLeft, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostSkeleton } from "@/components/dashboard/PostSkeleton";

type TabType = "posts" | "bookmarks" | "collaborations" | "contributions";

const TABS: { id: TabType; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "collaborations", label: "Collaborations" },
  { id: "contributions", label: "Contributions" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const userProfile = await getMe(token);
        if (userProfile) {
          setProfile(userProfile);
          setEditName(userProfile.full_name || "");
          setEditBio(userProfile.bio || "");
          setEditAvatarUrl(userProfile.avatar_url || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadTabContent() {
      if (!profile) return;
      setLoadingPosts(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        let res;
        switch (activeTab) {
          case "posts":
            res = await getPosts(token, undefined, profile.username, "posts");
            break;
          case "bookmarks":
            res = await getUserSavedPosts(token);
            break;
          case "collaborations":
            res = await getUserCollaboratedPosts(token, profile.username);
            break;
          case "contributions":
            res = await getPosts(token, undefined, profile.username);
            break;
        }
        setPosts(res?.posts || []);
      } catch (err) {
        console.error("Failed to load tab content:", err);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    }
    loadTabContent();
  }, [activeTab, profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setEditAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Error uploading avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const updated = await updateProfile(token, {
        full_name: editName,
        bio: editBio,
        avatar_url: editAvatarUrl,
      });

      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <header className="sticky top-14 md:top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 h-14 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">Profile</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
          <Edit2 className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </header>

      {/* Profile Header section */}
      <div className="px-4 sm:px-6 pt-10 pb-6 border-b border-border/50 relative overflow-hidden">
        {/* Subtle background glow effect behind avatar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-primary/10 blur-[80px] rounded-full point-events-none" />

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <Avatar
            src={profile.avatar_url ?? undefined}
            fallback={profile.full_name}
            size="lg"
            className="size-32 border-4 border-background shadow-xl ring-2 ring-primary/20 text-4xl"
          />
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{profile.full_name}</h2>
              <p className="text-muted-foreground text-lg mt-0.5">@{profile.username}</p>
            </div>
            {profile.bio && (
              <p className="text-foreground/90 max-w-lg mx-auto md:mx-0 leading-relaxed text-sm">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-6 mt-4 pt-2">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl font-bold">{profile.contributions_count || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contributions</span>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl font-bold">{profile.collaborations_count || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Collaborations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="sticky top-28 md:top-14 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 shrink-0 flex overflow-x-auto no-scrollbar">
        <div className="flex w-full max-w-3xl mx-auto border-b border-transparent space-x-2 sm:space-x-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative whitespace-nowrap py-4 px-2 text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground/80"
                  }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.5)] transition-all duration-300" />
                )}
                <div className="absolute inset-x-2 -inset-y-1 bg-foreground/5 rounded-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-2xl mx-auto min-h-[50vh]">
        {loadingPosts ? (
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {posts.map((post) => (
              <PostCard key={post.id} post={mapApiPostToPost(post)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-8 ring-primary/5">
              <Info className="size-8 text-primary/60" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">No {activeTab} yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {activeTab === "posts" && "When you publish original ideas, they'll show up here."}
              {activeTab === "bookmarks" && "Posts you save will appear in this tab."}
              {activeTab === "collaborations" && "Posts you collaborate on will be listed here."}
              {activeTab === "contributions" && "All your contributions, including parent posts and collaborations."}
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Edit Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/50 flex items-center justify-between shrink-0 bg-muted/20">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="size-5 text-primary" />
                Edit Profile
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-full text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 shrink">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar
                    src={editAvatarUrl ? editAvatarUrl : (profile.avatar_url ?? undefined)}
                    fallback={profile.full_name}
                    size="lg"
                    className="size-24 border-2 border-border transition-all duration-300 group-hover:border-primary/50 text-3xl"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200 backdrop-blur-[2px]"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <Camera className="size-6 mb-1 drop-shadow-md" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Click image to change</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-muted-foreground flex items-center gap-2">
                    <User className="size-4" /> Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="E.g. John Doe"
                    disabled={savingProfile}
                    className="bg-background/50 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-muted-foreground flex items-center gap-2">
                    <AlignLeft className="size-4" /> Bio
                  </Label>
                  {/* Since there's no native Textarea UI component, using a styled HTML textarea that matches Input */}
                  <textarea
                    id="bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    disabled={savingProfile}
                    placeholder="Tell us about yourself..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-border/50 bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button
                disabled={savingProfile || uploadingAvatar}
                onClick={handleSaveProfile}
                className="w-full sm:w-auto min-w-32 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow transition-transform active:scale-95"
              >
                {savingProfile ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
