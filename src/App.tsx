/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  PenTool,
  BookOpen,
  Heart,
  Bell,
  User,
  Sparkles,
  Target,
  LogIn,
  ArrowRight,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  AIFeedbackResult,
  CommentItem,
  LearningMode,
  NavSection,
  NotificationItem,
  Post,
  PracticeAttempt,
  UserProfile,
} from './types';
import { INITIAL_COMMENTS, INITIAL_COMMUNITY_POSTS } from './data/seedData';
import { HomeFeed } from './components/HomeFeed';
import { WriteStudio } from './components/WriteStudio';
import { PracticeHub } from './components/PracticeHub';
import { NotificationsView, ProfileView } from './components/ProfileAndProgress';

const DEFAULT_PROFILE: UserProfile = {
  uid: 'guest-learner',
  displayName: 'Học viên EnglishHub',
  photoURL:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: 'Đang chinh phục mục tiêu tiếng Anh học thuật & công sở cùng EnglishHub AI.',
  learningMode: 'IELTS',
  targetScore: 'IELTS 8.0',
  streakDays: 7,
  xp: 1240,
  frequentMistakes: [
    'Danh từ số nhiều sau lượng từ (many/several)',
    'Sự hòa hợp chủ ngữ - động từ (Subject-Verb Agreement)',
    'Giới từ "to" + V-ing trong cụm look forward to',
    'Phân biệt Despite + Noun và Although + Clause',
  ],
  createdAt: new Date().toISOString(),
};

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [posts, setPosts] = useState<Post[]>(INITIAL_COMMUNITY_POSTS);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>(() => {
    const grouped: Record<string, CommentItem[]> = {};
    INITIAL_COMMENTS.forEach((c) => {
      if (!grouped[c.postId]) grouped[c.postId] = [];
      grouped[c.postId].push(c);
    });
    return grouped;
  });
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([
    {
      id: 'init-attempt-1',
      userId: 'guest-learner',
      mode: 'IELTS',
      category: 'Grammar',
      title: 'Grammatical Range Band 8.0: Inversion & Quantifiers',
      score: 3,
      total: 3,
      estimatedBandOrScore: 'Band 8.0',
      mistakesLogged: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      recipientId: 'guest-learner',
      actorName: 'EnglishHub AI Tutor',
      actorAvatar:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      type: 'ai_feedback',
      postTitle: 'My Motivation for Learning English',
      message:
        'AI đã phát hiện lỗi "many reason → many reasons" và tạo sẵn bộ câu hỏi ôn tập ngữ pháp số nhiều cho bạn.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'notif-2',
      recipientId: 'guest-learner',
      actorName: 'Minh Anh Nguyễn',
      actorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: 'comment',
      postTitle: 'Why Mastering English Is Essential in the Digital Era',
      message: 'Đã chia sẻ bài viết mới đạt mốc nâng cấp IELTS 8.0 trong cộng đồng.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
  ]);

  const [writeStudioDraft, setWriteStudioDraft] = useState<{
    title: string;
    content: string;
    topicTag: string;
  } | null>(null);

  // 1. Auth Listener & User Profile Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            } else {
              const newProfile: UserProfile = {
                uid: user.uid,
                displayName: user.displayName || 'Học viên EnglishHub',
                photoURL:
                  user.photoURL ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                bio: 'Đang chinh phục mục tiêu TOEIC 800+ & IELTS 8.0 cùng EnglishHub AI.',
                learningMode: 'IELTS',
                targetScore: 'IELTS 8.0',
                streakDays: 7,
                xp: 1250,
                frequentMistakes: DEFAULT_PROFILE.frequentMistakes,
                createdAt: new Date().toISOString(),
              };
              try {
                await setDoc(userRef, newProfile);
                setProfile(newProfile);
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
              }
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
        );
        return () => unsubProfile();
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Real-time Community Posts & Comments Listener
  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const remotePosts: Post[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Post, 'id'>),
        }));
        const remoteIds = new Set(remotePosts.map((p) => p.id));
        const merged = [
          ...remotePosts,
          ...INITIAL_COMMUNITY_POSTS.filter((seed) => !remoteIds.has(seed.id)),
        ];
        setPosts(merged);
      },
      (err) => {
        console.warn('Posts snapshot notice:', err);
      }
    );

    const commentsQuery = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const unsubComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const remoteComments: CommentItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CommentItem, 'id'>),
        }));
        const grouped: Record<string, CommentItem[]> = {};
        INITIAL_COMMENTS.forEach((c) => {
          if (!grouped[c.postId]) grouped[c.postId] = [];
          grouped[c.postId].push(c);
        });
        remoteComments.forEach((c) => {
          if (!grouped[c.postId]) grouped[c.postId] = [];
          if (!grouped[c.postId].some((existing) => existing.id === c.id)) {
            grouped[c.postId].push(c);
          }
        });
        setCommentsByPost(grouped);
      },
      (err) => {
        console.warn('Comments snapshot notice:', err);
      }
    );

    return () => {
      unsubPosts();
      unsubComments();
    };
  }, []);

  // 3. Authenticated User's Practice Attempts Listener
  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, 'practiceAttempts'),
      where('userId', '==', firebaseUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: PracticeAttempt[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PracticeAttempt, 'id'>),
        }));
        if (loaded.length > 0) {
          setAttempts(
            loaded.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'practiceAttempts')
    );
    return () => unsub();
  }, [firebaseUser]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleModeChange = async (mode: LearningMode) => {
    const targetScore = mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+';
    setProfile((prev) => ({ ...prev, learningMode: mode, targetScore }));
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          learningMode: mode,
          targetScore,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const nextProfile = { ...profile, ...updates };
    setProfile(nextProfile);
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const handleRecordMistakes = async (newMistakes: string[]) => {
    const combined = Array.from(new Set([...newMistakes, ...profile.frequentMistakes])).slice(
      0,
      10
    );
    const nextXp = profile.xp + 30;
    setProfile((prev) => ({
      ...prev,
      frequentMistakes: combined,
      xp: nextXp,
    }));
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          frequentMistakes: combined,
          xp: nextXp,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const handlePublishPost = async ({
    title,
    content,
    mode,
    topicTag,
    aiResult,
  }: {
    title: string;
    content: string;
    mode: LearningMode;
    topicTag: string;
    aiResult: AIFeedbackResult | null;
  }) => {
    const newPostData: Omit<Post, 'id'> = {
      authorId: firebaseUser ? firebaseUser.uid : profile.uid,
      authorName: profile.displayName,
      authorAvatar: profile.photoURL,
      authorTarget: mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+',
      title,
      content,
      mode,
      topicTag,
      aiScore: aiResult ? `${mode} ${aiResult.overallScore}` : `${mode} Reviewed`,
      aiSummary: aiResult?.summaryFeedback || '',
      aiCorrectionsJson: aiResult ? JSON.stringify(aiResult.corrections) : '[]',
      likesCount: 1,
      likedBy: [firebaseUser ? firebaseUser.uid : profile.uid],
      savedBy: [],
      commentsCount: 0,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    if (firebaseUser) {
      try {
        await addDoc(collection(db, 'posts'), newPostData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'posts');
      }
    } else {
      const localPost: Post = {
        id: `local-post-${Date.now()}`,
        ...newPostData,
      };
      setPosts((prev) => [localPost, ...prev]);
    }
  };

  const handleToggleLike = async (post: Post) => {
    const uid = firebaseUser ? firebaseUser.uid : profile.uid;
    const alreadyLiked = post.likedBy.includes(uid);
    const updatedLikedBy = alreadyLiked
      ? post.likedBy.filter((id) => id !== uid)
      : [...post.likedBy, uid];
    const updatedLikesCount = Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedBy: updatedLikedBy, likesCount: updatedLikesCount }
          : p
      )
    );

    if (firebaseUser && !post.id.startsWith('seed-') && !post.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'posts', post.id), {
          likedBy: updatedLikedBy,
          likesCount: updatedLikesCount,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
      }
    }
  };

  const handleToggleSave = async (post: Post) => {
    const uid = firebaseUser ? firebaseUser.uid : profile.uid;
    const alreadySaved = post.savedBy.includes(uid);
    const updatedSavedBy = alreadySaved
      ? post.savedBy.filter((id) => id !== uid)
      : [...post.savedBy, uid];

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, savedBy: updatedSavedBy } : p))
    );

    if (firebaseUser && !post.id.startsWith('seed-') && !post.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'posts', post.id), {
          savedBy: updatedSavedBy,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
      }
    }
  };

  const handleAddComment = async (post: Post, content: string) => {
    const uid = firebaseUser ? firebaseUser.uid : profile.uid;
    const newCommentData: Omit<CommentItem, 'id'> = {
      postId: post.id,
      authorId: uid,
      authorName: profile.displayName,
      authorAvatar: profile.photoURL,
      content,
      createdAt: new Date().toISOString(),
    };

    const localComment: CommentItem = {
      id: `comment-${Date.now()}`,
      ...newCommentData,
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [post.id]: [...(prev[post.id] || []), localComment],
    }));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );

    if (firebaseUser) {
      try {
        await addDoc(collection(db, 'comments'), newCommentData);
        if (!post.id.startsWith('seed-') && !post.id.startsWith('local-')) {
          await updateDoc(doc(db, 'posts', post.id), {
            commentsCount: post.commentsCount + 1,
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'comments');
      }
    }
  };

  const handleCompleteAttempt = async (data: {
    mode: LearningMode;
    category: string;
    title: string;
    score: number;
    total: number;
    estimatedBandOrScore: string;
    mistakesLogged: string[];
  }) => {
    const uid = firebaseUser ? firebaseUser.uid : profile.uid;
    const newAttemptData: Omit<PracticeAttempt, 'id'> = {
      userId: uid,
      ...data,
      createdAt: new Date().toISOString(),
    };

    const localAttempt: PracticeAttempt = {
      id: `att-${Date.now()}`,
      ...newAttemptData,
    };

    setAttempts((prev) => [localAttempt, ...prev]);
    if (data.mistakesLogged.length > 0) {
      await handleRecordMistakes(data.mistakesLogged);
    } else {
      await handleUpdateProfile({ xp: profile.xp + 50 });
    }

    if (firebaseUser) {
      try {
        await addDoc(collection(db, 'practiceAttempts'), newAttemptData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'practiceAttempts');
      }
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const savedPostsCount = posts.filter((p) =>
    p.savedBy.includes(firebaseUser ? firebaseUser.uid : profile.uid)
  ).length;

  const navItems: {
    id: NavSection;
    label: string;
    emoji: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Home', emoji: '🏠', icon: Home },
    { id: 'write', label: 'Write & AI Sửa Bài', emoji: '✍️', icon: PenTool },
    { id: 'practice', label: 'Practice', emoji: '📚', icon: BookOpen },
    { id: 'saved', label: 'Saved', emoji: '❤️', icon: Heart, badge: savedPostsCount },
    {
      id: 'notifications',
      label: 'Notifications',
      emoji: '🔔',
      icon: Bell,
      badge: unreadNotifCount,
    },
    { id: 'profile', label: 'Profile', emoji: '👤', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#18181B] flex flex-col md:flex-row">
      {/* LEFT SIDEBAR NAVIGATION (EnglishHub AI Tree) */}
      <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-[#E6E1D6] bg-[#FAF8F5] md:sticky md:top-0 md:h-screen flex flex-col justify-between p-4 md:p-5 shrink-0">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => setActiveNav('home')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#18181B] text-white flex items-center justify-center font-editorial font-bold text-lg">
                E
              </div>
              <div>
                <div className="font-editorial font-bold text-lg leading-none text-[#18181B]">
                  EnglishHub AI
                </div>
                <div className="text-[11px] font-medium text-[#6E6A63] mt-0.5">
                  TOEIC 800+ & IELTS 8.0 Atelier
                </div>
              </div>
            </div>
          </div>

          {/* Global Learning Mode Switcher (TOEIC 800+ vs IELTS 8.0) */}
          <div className="p-3 rounded-xl bg-[#F3EFEA] border border-[#E6E1D6] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#57534E]">
              <span>🎯 Chế độ học</span>
              <span
                className={`font-mono-code ${
                  profile.learningMode === 'IELTS' ? 'text-[#5B3FD9]' : 'text-[#1E40AF]'
                }`}
              >
                {profile.targetScore}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleModeChange('TOEIC')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  profile.learningMode === 'TOEIC'
                    ? 'bg-[#1E40AF] text-white shadow-2xs'
                    : 'bg-white text-[#57534E] hover:text-[#18181B]'
                }`}
              >
                TOEIC 800+
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('IELTS')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  profile.learningMode === 'IELTS'
                    ? 'bg-[#5B3FD9] text-white shadow-2xs'
                    : 'bg-white text-[#57534E] hover:text-[#18181B]'
                }`}
              >
                IELTS 8.0
              </button>
            </div>
          </div>

          {/* Primary Navigation Items */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#18181B] text-white'
                      : 'text-[#57534E] hover:bg-[#F3EFEA] hover:text-[#18181B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-mono-code text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white text-[#18181B]'
                          : 'bg-[#E6E1D6] text-[#18181B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Architecture Sub-tree Quick Links on Desktop */}
          <div className="hidden md:block pt-3 border-t border-[#E6E1D6] space-y-2 text-xs text-[#57534E]">
            <div className="font-bold uppercase tracking-wider text-[11px] text-[#6E6A63]">
              Lộ trình {profile.learningMode === 'TOEIC' ? 'TOEIC 800+' : 'IELTS 8.0'}
            </div>
            {profile.learningMode === 'TOEIC' ? (
              <div className="grid grid-cols-2 gap-1.5">
                {['Vocabulary', 'Grammar', 'Reading', 'Listening', 'Mini test'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveNav('practice')}
                    className="text-left px-2.5 py-1.5 rounded bg-white border border-[#E6E1D6] hover:border-[#1E40AF] font-medium text-[#18181B] transition cursor-pointer"
                  >
                    • {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {['Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'].map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveNav('practice')}
                      className="text-left px-2.5 py-1.5 rounded bg-white border border-[#E6E1D6] hover:border-[#5B3FD9] font-medium text-[#18181B] transition cursor-pointer"
                    >
                      • {s}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Card */}
        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-[#E6E1D6]">
          <div
            onClick={() => setActiveNav('profile')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F3EFEA] transition cursor-pointer"
          >
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-9 h-9 rounded-full object-cover border border-[#E6E1D6]"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#18181B] truncate">
                {profile.displayName}
              </div>
              <div className="text-[11px] text-[#6E6A63] truncate">
                🔥 {profile.streakDays} ngày • {profile.xp} XP
              </div>
            </div>
          </div>

          {!firebaseUser && (
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#D6D1C7] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập Google lưu đám mây
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeNav === 'write' && (
          <WriteStudio
            learningMode={profile.learningMode}
            onModeChange={handleModeChange}
            onPublishPost={handlePublishPost}
            onRecordMistakes={handleRecordMistakes}
            initialDraft={writeStudioDraft}
          />
        )}

        {activeNav === 'practice' && (
          <PracticeHub
            learningMode={profile.learningMode}
            onModeChange={handleModeChange}
            frequentMistakes={profile.frequentMistakes}
            onCompleteAttempt={handleCompleteAttempt}
          />
        )}

        {(activeNav === 'home' || activeNav === 'saved') && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8">
              <HomeFeed
                posts={posts}
                commentsByPost={commentsByPost}
                currentUserId={firebaseUser ? firebaseUser.uid : profile.uid}
                learningMode={profile.learningMode}
                isSavedView={activeNav === 'saved'}
                onToggleLike={handleToggleLike}
                onToggleSave={handleToggleSave}
                onAddComment={handleAddComment}
                onOpenInWriteStudio={(draft) => {
                  setWriteStudioDraft(draft);
                  setActiveNav('write');
                }}
                onNavigateWrite={() => {
                  setWriteStudioDraft(null);
                  setActiveNav('write');
                }}
              />
            </div>

            {/* RIGHT PEDAGOGICAL SPOTLIGHT RAIL (4 cols on XL) */}
            <div className="xl:col-span-4 space-y-5 xl:sticky xl:top-8">
              {/* Spotlight Card: Why Pedagogical AI Matters */}
              <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">
                    🤖 Góc Sửa Lỗi Điển Hình
                  </span>
                  <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-[#F3EFEA] font-semibold">
                    Grammar Diff
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] space-y-1">
                  <div className="text-[11px] font-semibold text-[#6E6A63]">User viết:</div>
                  <div className="text-sm font-medium text-[#18181B]">
                    "I have many reason to learn English."
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E6E1D6] bg-white space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#18181B]">Grammar:</span>
                    <span className="font-mono-code px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] line-through">
                      ❌ reason
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#6E6A63]" />
                    <span className="font-mono-code px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-bold">
                      reasons
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#FAF8F5] border-l-3 border-[#059669] text-[#18181B]">
                    <strong className="text-[#059669]">Correct:</strong> I have many reasons to learn English.
                  </div>
                  <div className="text-[#57534E]">
                    <strong className="text-[#18181B]">Explanation:</strong> Sau <em>many</em> cần danh từ đếm được số nhiều.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav('write')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
                >
                  ✍️ Kiểm tra bài viết của bạn ngay
                </button>
              </div>

              {/* Frequent Mistakes Quick Widget */}
              <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#D97706]" />
                  <h3 className="text-sm font-bold text-[#18181B]">
                    🧠 Lỗi bạn thường mắc ({profile.frequentMistakes.length})
                  </h3>
                </div>
                <ul className="space-y-2">
                  {profile.frequentMistakes.slice(0, 3).map((m, i) => (
                    <li
                      key={i}
                      className="text-xs text-[#57534E] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E6E1D6] flex items-start gap-2"
                    >
                      <span className="font-mono-code font-bold text-[#D97706]">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setActiveNav('practice')}
                  className="w-full py-2 px-3 rounded-lg border border-[#D6D1C7] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
                >
                  Tạo bài luyện tập từ các lỗi này →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
          />
        )}

        {activeNav === 'profile' && (
          <ProfileView
            profile={profile}
            userPosts={posts.filter(
              (p) =>
                p.authorId === (firebaseUser ? firebaseUser.uid : profile.uid) ||
                p.authorName === profile.displayName
            )}
            attempts={attempts}
            isAuthenticated={Boolean(firebaseUser)}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onUpdateProfile={handleUpdateProfile}
            onGoToMistakeDrill={() => setActiveNav('practice')}
          />
        )}
      </main>
    </div>
  );
}
