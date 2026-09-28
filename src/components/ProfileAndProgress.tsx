import React, { useState } from 'react';
import {
  Trophy,
  Target,
  FileText,
  TrendingUp,
  CheckCheck,
  Sparkles,
  Brain,
  LogOut,
  Edit3,
  Check,
  Bell,
  AlertCircle,
} from 'lucide-react';
import {
  NotificationItem,
  Post,
  PracticeAttempt,
  UserProfile,
} from '../types';

interface ProfileViewProps {
  profile: UserProfile | null;
  userPosts: Post[];
  attempts: PracticeAttempt[];
  isAuthenticated: boolean;
  authError: string | null;
  onSignInGoogle: () => void;
  onSignInFacebook: () => void;
  onSignOut: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onGoToMistakeDrill: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  userPosts,
  attempts,
  isAuthenticated,
  authError,
  onSignInGoogle,
  onSignInFacebook,
  onSignOut,
  onUpdateProfile,
  onGoToMistakeDrill,
}) => {
  const [subTab, setSubTab] = useState<'posts' | 'scores' | 'progress' | 'target'>('progress');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.displayName || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');

  if (!isAuthenticated || !profile) {
    return (
      <div className="max-w-md mx-auto bg-white border border-[#E6E1D6] rounded-xl p-6 md:p-8 shadow-xs space-y-6 my-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#18181B] text-white flex items-center justify-center font-editorial font-bold text-xl mx-auto">
            E
          </div>
          <h1 className="text-2xl font-bold text-[#18181B]">
            Đăng nhập vào EnglishHub AI
          </h1>
          <p className="text-sm text-[#57534E]">
            Đăng nhập bằng tài khoản thực để đăng bài viết, bình luận, lưu bài viết và theo dõi tiến độ học tập của riêng bạn.
          </p>
        </div>

        {authError && (
          <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={onSignInGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#D6D1C7] bg-white hover:bg-[#FAF8F5] text-sm font-bold text-[#18181B] transition cursor-pointer shadow-2xs"
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
            <span>Tiếp tục với Google</span>
          </button>

          <button
            type="button"
            onClick={onSignInFacebook}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-sm font-bold text-white transition cursor-pointer shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Tiếp tục với Facebook</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    await onUpdateProfile({
      displayName: nameInput.trim() || profile.displayName,
      bio: bioInput.trim(),
    });
    setIsEditingName(false);
  };

  const totalCorrect = attempts.reduce((acc, a) => acc + a.score, 0);
  const totalQuestions = attempts.reduce((acc, a) => acc + a.total, 0);
  const accuracyPct =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Profile Hero Banner */}
      <div className="bg-white border border-[#E6E1D6] rounded-xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#18181B]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xl">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#18181B] text-sm font-bold bg-[#FAF8F5]"
                  placeholder="Tên hiển thị..."
                />
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="block w-full px-3 py-1.5 rounded border border-[#E6E1D6] text-xs bg-[#FAF8F5]"
                  placeholder="Giới thiệu mục tiêu học tập..."
                />
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#059669] text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Lưu hồ sơ
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-[#18181B]">
                    {profile.displayName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(profile.displayName);
                      setBioInput(profile.bio);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded hover:bg-[#F3EFEA] text-[#6E6A63] cursor-pointer"
                    title="Chỉnh sửa hồ sơ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {profile.bio && <p className="text-sm text-[#57534E]">{profile.bio}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={`font-mono-code text-xs font-bold px-2.5 py-0.5 rounded ${
                      profile.learningMode === 'IELTS'
                        ? 'bg-[#F6F4FF] text-[#5B3FD9]'
                        : 'bg-[#F0F5FF] text-[#1E40AF]'
                    }`}
                  >
                    🎯 Mục tiêu: {profile.targetScore}
                  </span>
                  <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                    ⚡ {profile.xp} XP
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* 4 Sub-tabs: Tiến độ | Bài đã đăng | Điểm luyện tập | Mục tiêu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E1D6] pb-3">
        <button
          type="button"
          onClick={() => setSubTab('progress')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            subTab === 'progress'
              ? 'bg-[#18181B] text-white'
              : 'bg-white border border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Tiến độ học tập
        </button>
        <button
          type="button"
          onClick={() => setSubTab('posts')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            subTab === 'posts'
              ? 'bg-[#18181B] text-white'
              : 'bg-white border border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Bài đã đăng ({userPosts.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('scores')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            subTab === 'scores'
              ? 'bg-[#18181B] text-white'
              : 'bg-white border border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Điểm luyện tập ({attempts.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('target')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            subTab === 'target'
              ? 'bg-[#18181B] text-white'
              : 'bg-white border border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Mục tiêu (TOEIC 800+ / IELTS 8.0)
        </button>
      </div>

      {/* TAB 1: TIẾN ĐỘ HỌC TẬP */}
      {subTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E6E1D6] rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#18181B]">
              🏆 Thống kê học tập thực tế của bạn
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Bài đã đăng</div>
                <div className="font-mono-code text-2xl font-bold text-[#18181B] mt-1">
                  {userPosts.length}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Tỉ lệ đúng bài tập</div>
                <div className="font-mono-code text-2xl font-bold text-[#059669] mt-1">
                  {totalQuestions > 0 ? `${accuracyPct}%` : '—'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Điểm tích lũy</div>
                <div className="font-mono-code text-2xl font-bold text-[#5B3FD9] mt-1">
                  {profile.xp} XP
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] text-xs text-[#57534E] leading-relaxed">
              Số liệu trên được ghi nhận 100% từ các bài viết bạn đã phân tích/đăng tải và các lượt làm bài luyện tập của bạn.
            </div>
          </div>

          {/* Frequent Mistakes & AI Drill Launcher */}
          <div className="lg:col-span-5 bg-white border border-[#E6E1D6] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#D97706]" />
              <h2 className="text-lg font-bold text-[#18181B]">
                Sổ tay lỗi thường mắc của bạn
              </h2>
            </div>
            {profile.frequentMistakes.length === 0 ? (
              <p className="text-xs text-[#57534E] leading-relaxed">
                Bạn chưa có lỗi nào được ghi nhận. Khi bạn sử dụng AI sửa bài viết ở mục <strong>✍️ Write</strong> hoặc làm bài ở mục <strong>📚 Practice</strong>, các lỗi thực tế của bạn sẽ hiển thị tại đây.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {profile.frequentMistakes.map((mistake, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] text-xs font-semibold text-[#18181B] flex items-center gap-2"
                    >
                      <span className="font-mono-code text-[#DC2626]">#{idx + 1}</span>
                      <span>{mistake}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onGoToMistakeDrill}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                  🧠 Luyện bài tập AI khắc phục các lỗi này
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BÀI ĐÃ ĐĂNG */}
      {subTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="bg-white border border-[#E6E1D6] rounded-xl p-8 text-center text-sm text-[#57534E]">
              Bạn chưa đăng bài viết nào. Hãy vào mục <strong>✍️ Write</strong> để viết bài và chia sẻ cùng cộng đồng!
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-[#E6E1D6] rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5B3FD9]">
                    {post.mode} • {post.topicTag}
                  </span>
                  <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E6E1D6]">
                    {post.aiScore}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#18181B]">{post.title}</h3>
                <p className="text-sm text-[#57534E]">{post.content}</p>
                <div className="text-xs text-[#6E6A63] pt-1">
                  ❤️ {post.likesCount} lượt thích • 💬 {post.commentsCount} bình luận
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ĐIỂM LUYỆN TẬP */}
      {subTab === 'scores' && (
        <div className="bg-white border border-[#E6E1D6] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E6E1D6] bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
            Lịch sử làm bài luyện tập & Mini Test
          </div>
          {attempts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#57534E]">
              Bạn chưa có lượt làm bài nào được lưu. Hãy hoàn thành bài tập trong mục <strong>📚 Practice</strong>!
            </div>
          ) : (
            <div className="divide-y divide-[#E6E1D6]">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-[#F3EFEA]">
                        {att.mode} • {att.category}
                      </span>
                      <span className="text-sm font-bold text-[#18181B]">{att.title}</span>
                    </div>
                    <div className="text-xs text-[#6E6A63] mt-1">
                      Hoàn thành:{' '}
                      {new Date(att.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-code text-xs font-bold text-[#059669]">
                      Đúng {att.score}/{att.total}
                    </span>
                    <span className="font-mono-code text-xs font-bold px-3 py-1 rounded bg-[#18181B] text-white">
                      {att.estimatedBandOrScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MỤC TIÊU HỌC TẬP */}
      {subTab === 'target' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() =>
              onUpdateProfile({ learningMode: 'TOEIC', targetScore: 'TOEIC 800+' })
            }
            className={`p-6 rounded-xl border-2 transition cursor-pointer space-y-3 ${
              profile.learningMode === 'TOEIC'
                ? 'bg-[#F0F5FF] border-[#1E40AF]'
                : 'bg-white border-[#E6E1D6] hover:border-[#1E40AF]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs font-bold px-2.5 py-1 rounded bg-[#1E40AF] text-white">
                TOEIC MODE
              </span>
              {profile.learningMode === 'TOEIC' && (
                <span className="text-xs font-bold text-[#1E40AF]">✓ Đang kích hoạt</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#18181B]">Mục tiêu TOEIC 800+</h3>
            <p className="text-sm text-[#57534E]">
              Tập trung vào Vocabulary thương mại, Grammar Part 5/6, Reading Part 7, Listening Part 3/4 và Mini Test.
            </p>
          </div>

          <div
            onClick={() =>
              onUpdateProfile({ learningMode: 'IELTS', targetScore: 'IELTS 8.0' })
            }
            className={`p-6 rounded-xl border-2 transition cursor-pointer space-y-3 ${
              profile.learningMode === 'IELTS'
                ? 'bg-[#F6F4FF] border-[#5B3FD9]'
                : 'bg-white border-[#E6E1D6] hover:border-[#5B3FD9]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs font-bold px-2.5 py-1 rounded bg-[#5B3FD9] text-white">
                IELTS MODE
              </span>
              {profile.learningMode === 'IELTS' && (
                <span className="text-xs font-bold text-[#5B3FD9]">✓ Đang kích hoạt</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#18181B]">Mục tiêu IELTS 8.0</h3>
            <p className="text-sm text-[#57534E]">
              Tập trung vào 4 kỹ năng Listening, Reading, Writing, Speaking cùng Academic Vocabulary & Complex Grammar chuẩn Band 8.0.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            🔔 Notifications
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            Thông báo của bạn
          </h1>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6E1D6] bg-white hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-[#E6E1D6] rounded-xl p-10 text-center space-y-3">
          <Bell className="w-8 h-8 text-[#6E6A63] mx-auto" />
          <h3 className="text-lg font-bold text-[#18181B]">Chưa có thông báo mới</h3>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            Khi có người thích hoặc bình luận vào bài viết của bạn, thông báo thực tế sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E6E1D6] rounded-xl divide-y divide-[#E6E1D6]">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3.5 ${
                !n.read ? 'bg-[#FAF8F5]' : 'bg-white'
              }`}
            >
              {n.actorAvatar ? (
                <img
                  src={n.actorAvatar}
                  alt={n.actorName}
                  className="w-10 h-10 rounded-full object-cover border border-[#E6E1D6]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-sm">
                  {n.actorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#18181B]">{n.actorName}</span>
                  <span className="text-xs text-[#6E6A63]">
                    {new Date(n.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-[#57534E]">{n.message}</p>
                {n.postTitle && (
                  <p className="text-xs font-semibold text-[#5B3FD9]">
                    Bài viết: "{n.postTitle}"
                  </p>
                )}
              </div>
              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B3FD9] mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
