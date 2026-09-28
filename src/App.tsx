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
  ArrowRight,
  Brain,
  X,
  AlertCircle,
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
  facebookProvider,
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
import { HomeFeed } from './components/HomeFeed';
import { WriteStudio } from './components/WriteStudio';
import { PracticeHub } from './components/PracticeHub';
import { NotificationsView, ProfileView } from './components/ProfileAndProgress';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learningMode, setLearningMode] = useState<LearningMode>('IELTS');
  const [localMistakes, setLocalMistakes] = useState<string[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [writeStudioDraft, setWriteStudioDraft] = useState<{
    title: string;
    content: string;
    topicTag: string;
  } | null>(null);

  // 1. Auth Listener & Real User Profile Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setShowAuthModal(false);
        setAuthError(null);
        const userRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setProfile(data);
              setLearningMode(data.learningMode);
            } else {
              const newProfile: UserProfile = {
                uid: user.uid,
                displayName:
                  user.displayName || user.email?.split('@')[0] || 'Người dùng',
                photoURL: user.photoURL || '',
                bio: '',
                learningMode: 'IELTS',
                targetScore: 'IELTS 8.0',
                streakDays: 1,
                xp: 0,
                frequentMistakes: [],
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
        setProfile(null);
        setAttempts([]);
        setNotifications([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Real-time Community Posts & Comments Listener (100% real Firestore data)
  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const remotePosts: Post[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Post, 'id'>),
        }));
        setPosts(remotePosts);
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
        remoteComments.forEach((c) => {
          if (!grouped[c.postId]) grouped[c.postId] = [];
          grouped[c.postId].push(c);
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

  // 3. Authenticated User's Practice Attempts & Notifications Listener
  useEffect(() => {
    if (!firebaseUser) return;

    const attemptsQuery = query(
      collection(db, 'practiceAttempts'),
      where('userId', '==', firebaseUser.uid)
    );
    const unsubAttempts = onSnapshot(
      attemptsQuery,
      (snap) => {
        const loaded: PracticeAttempt[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PracticeAttempt, 'id'>),
        }));
        setAttempts(
          loaded.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'practiceAttempts')
    );

    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', firebaseUser.uid)
    );
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snap) => {
        const loaded: NotificationItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<NotificationItem, 'id'>),
        }));
        setNotifications(
          loaded.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubAttempts();
      unsubNotifs();
    };
  }, [firebaseUser]);

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setAuthError(`Đăng nhập Google không thành công: ${msg}`);
    }
  };

  const handleSignInFacebook = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'Phương thức đăng nhập Facebook cần được bật (Enable) kèm App ID & App Secret trong bảng điều khiển Firebase Authentication.'
        );
      } else {
        setAuthError(`Đăng nhập Facebook không thành công: ${msg}`);
      }
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
    setLearningMode(mode);
    const targetScore = mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+';
    if (firebaseUser && profile) {
      setProfile((prev) => (prev ? { ...prev, learningMode: mode, targetScore } : null));
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
    if (!firebaseUser || !profile) return;
    if (updates.learningMode) {
      setLearningMode(updates.learningMode);
    }
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleRecordMistakes = async (newMistakes: string[]) => {
    if (firebaseUser && profile) {
      const combined = Array.from(
        new Set([...newMistakes, ...profile.frequentMistakes])
      ).slice(0, 15);
      const nextXp = profile.xp + 20;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          frequentMistakes: combined,
          xp: nextXp,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    } else {
      setLocalMistakes((prev) =>
        Array.from(new Set([...newMistakes, ...prev])).slice(0, 15)
      );
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
    if (!firebaseUser || !profile) {
      setShowAuthModal(true);
      return;
    }

    const newPostData: Omit<Post, 'id'> = {
      authorId: firebaseUser.uid,
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
      likesCount: 0,
      likedBy: [],
      savedBy: [],
      commentsCount: 0,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'posts'), newPostData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!firebaseUser || !profile) {
      setShowAuthModal(true);
      return;
    }
    const uid = firebaseUser.uid;
    const alreadyLiked = post.likedBy.includes(uid);
    const updatedLikedBy = alreadyLiked
      ? post.likedBy.filter((id) => id !== uid)
      : [...post.likedBy, uid];
    const updatedLikesCount = Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1));

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likedBy: updatedLikedBy,
        likesCount: updatedLikesCount,
      });

      if (!alreadyLiked && post.authorId !== uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: post.authorId,
          actorName: profile.displayName,
          actorAvatar: profile.photoURL,
          type: 'like',
          postTitle: post.title,
          message: 'Đã thích bài viết tiếng Anh của bạn.',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!firebaseUser) {
      setShowAuthModal(true);
      return;
    }
    const uid = firebaseUser.uid;
    const alreadySaved = post.savedBy.includes(uid);
    const updatedSavedBy = alreadySaved
      ? post.savedBy.filter((id) => id !== uid)
      : [...post.savedBy, uid];

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        savedBy: updatedSavedBy,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleAddComment = async (post: Post, content: string) => {
    if (!firebaseUser || !profile) {
      setShowAuthModal(true);
      return;
    }
    const uid = firebaseUser.uid;
    const newCommentData: Omit<CommentItem, 'id'> = {
      postId: post.id,
      authorId: uid,
      authorName: profile.displayName,
      authorAvatar: profile.photoURL,
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'comments'), newCommentData);
      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: post.commentsCount + 1,
      });

      if (post.authorId !== uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: post.authorId,
          actorName: profile.displayName,
          actorAvatar: profile.photoURL,
          type: 'comment',
          postTitle: post.title,
          message: `Đã bình luận: "${content.slice(0, 80)}"`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
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
    if (data.mistakesLogged.length > 0) {
      await handleRecordMistakes(data.mistakesLogged);
    }

    if (firebaseUser && profile) {
      const newAttemptData: Omit<PracticeAttempt, 'id'> = {
        userId: firebaseUser.uid,
        ...data,
        createdAt: new Date().toISOString(),
      };
      try {
        await addDoc(collection(db, 'practiceAttempts'), newAttemptData);
        if (data.mistakesLogged.length === 0) {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            xp: profile.xp + 40,
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'practiceAttempts');
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!firebaseUser) return;
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { read: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notifications/${item.id}`);
      }
    }
  };

  const activeFrequentMistakes = profile
    ? profile.frequentMistakes
    : localMistakes;

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const savedPostsCount = firebaseUser
    ? posts.filter((p) => p.savedBy.includes(firebaseUser.uid)).length
    : 0;

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
      {/* AUTH MODAL (Google & Facebook) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E1D6] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#F3EFEA] text-[#6E6A63] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-[#18181B] text-white flex items-center justify-center font-editorial font-bold text-lg">
                E
              </div>
              <h2 className="text-xl font-bold text-[#18181B] pt-1">
                Đăng nhập vào EnglishHub AI
              </h2>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Chọn đăng nhập bằng Google hoặc Facebook để đăng bài, bình luận, lưu bài viết và đồng bộ tiến độ học tập.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSignInGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#D6D1C7] bg-white hover:bg-[#FAF8F5] text-sm font-bold text-[#18181B] transition cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </button>

              <button
                type="button"
                onClick={handleSignInFacebook}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-sm font-bold text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Đăng nhập bằng Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  TOEIC 800+ & IELTS 8.0
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
                  learningMode === 'IELTS' ? 'text-[#5B3FD9]' : 'text-[#1E40AF]'
                }`}
              >
                {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleModeChange('TOEIC')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  learningMode === 'TOEIC'
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
                  learningMode === 'IELTS'
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
              Lộ trình {learningMode === 'TOEIC' ? 'TOEIC 800+' : 'IELTS 8.0'}
            </div>
            {learningMode === 'TOEIC' ? (
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

        {/* Bottom Auth / User Section (Google & Facebook) */}
        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-[#E6E1D6]">
          {firebaseUser && profile ? (
            <div
              onClick={() => setActiveNav('profile')}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F3EFEA] transition cursor-pointer"
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-[#E6E1D6]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xs">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#18181B] truncate">
                  {profile.displayName}
                </div>
                <div className="text-[11px] text-[#6E6A63] truncate">
                  {profile.targetScore} • {profile.xp} XP
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6A63]">
                Đăng nhập tài khoản
              </div>
              <button
                type="button"
                onClick={handleSignInGoogle}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#D6D1C7] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Đăng nhập Google</span>
              </button>
              <button
                type="button"
                onClick={handleSignInFacebook}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-xs font-bold text-white transition cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Đăng nhập Facebook</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeNav === 'write' && (
          <WriteStudio
            learningMode={learningMode}
            isAuthenticated={Boolean(firebaseUser)}
            onModeChange={handleModeChange}
            onRequestAuth={() => setShowAuthModal(true)}
            onPublishPost={handlePublishPost}
            onRecordMistakes={handleRecordMistakes}
            initialDraft={writeStudioDraft}
          />
        )}

        {activeNav === 'practice' && (
          <PracticeHub
            learningMode={learningMode}
            onModeChange={handleModeChange}
            frequentMistakes={activeFrequentMistakes}
            onCompleteAttempt={handleCompleteAttempt}
          />
        )}

        {(activeNav === 'home' || activeNav === 'saved') && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8">
              <HomeFeed
                posts={posts}
                commentsByPost={commentsByPost}
                currentUserId={firebaseUser ? firebaseUser.uid : null}
                learningMode={learningMode}
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

            {/* RIGHT SIDEBAR RAIL */}
            <div className="xl:col-span-4 space-y-5 xl:sticky xl:top-8">
              {/* Quick Auth Card if not signed in */}
              {!firebaseUser && (
                <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-[#18181B]">
                    👤 Đăng nhập Cộng đồng EnglishHub
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Đăng nhập bằng Google hoặc Facebook để đăng bài viết của bạn và lưu tiến độ học tập.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSignInGoogle}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#D6D1C7] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#18181B] transition cursor-pointer"
                    >
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignInFacebook}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-xs font-bold text-white transition cursor-pointer"
                    >
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pedagogical Format Guide Card */}
              <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">
                    🤖 Cách AI Sửa Bài & Giải Thích
                  </span>
                  <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-[#F3EFEA] font-semibold">
                    Minh họa quy tắc
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] space-y-1">
                  <div className="text-[11px] font-semibold text-[#6E6A63]">Ví dụ câu đầu vào:</div>
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
                    <strong className="text-[#18181B]">Explanation:</strong> Sau <em>many</em> cần danh từ số nhiều.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav('write')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
                >
                  ✍️ Viết & Kiểm tra bài của bạn
                </button>
              </div>

              {/* Real Frequent Mistakes Quick Widget */}
              <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#D97706]" />
                  <h3 className="text-sm font-bold text-[#18181B]">
                    🧠 Lỗi bạn đã mắc ({activeFrequentMistakes.length})
                  </h3>
                </div>
                {activeFrequentMistakes.length === 0 ? (
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Chưa có dữ liệu lỗi sai. Khi bạn kiểm tra bài viết tại mục ✍️ Write, hệ thống sẽ ghi nhận các lỗi thực tế của bạn tại đây.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {activeFrequentMistakes.slice(0, 4).map((m, i) => (
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
          />
        )}

        {activeNav === 'profile' && (
          <ProfileView
            profile={profile}
            userPosts={
              firebaseUser
                ? posts.filter((p) => p.authorId === firebaseUser.uid)
                : []
            }
            attempts={attempts}
            isAuthenticated={Boolean(firebaseUser)}
            authError={authError}
            onSignInGoogle={handleSignInGoogle}
            onSignInFacebook={handleSignInFacebook}
            onSignOut={handleSignOut}
            onUpdateProfile={handleUpdateProfile}
            onGoToMistakeDrill={() => setActiveNav('practice')}
          />
        )}
      </main>
    </div>
  );
}
