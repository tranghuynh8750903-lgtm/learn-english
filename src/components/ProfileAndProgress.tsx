import React, { useState } from 'react';
import {
  User,
  Trophy,
  Target,
  FileText,
  TrendingUp,
  Bell,
  CheckCheck,
  Sparkles,
  Brain,
  LogIn,
  LogOut,
  Edit3,
  Check,
} from 'lucide-react';
import {
  LearningMode,
  NotificationItem,
  Post,
  PracticeAttempt,
  UserProfile,
} from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  userPosts: Post[];
  attempts: PracticeAttempt[];
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onGoToMistakeDrill: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  userPosts,
  attempts,
  isAuthenticated,
  onSignIn,
  onSignOut,
  onUpdateProfile,
  onGoToMistakeDrill,
}) => {
  const [subTab, setSubTab] = useState<'posts' | 'scores' | 'progress' | 'target'>('progress');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [bioInput, setBioInput] = useState(profile.bio);

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
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 78;

  return (
    <div className="space-y-6">
      {/* Profile Hero Banner */}
      <div className="bg-white border border-[#E6E1D6] rounded-xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#18181B]"
            referrerPolicy="no-referrer"
          />
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
                <p className="text-sm text-[#57534E]">{profile.bio}</p>
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
                  <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">
                    🔥 {profile.streakDays} ngày liên tiếp
                  </span>
                  <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                    ⚡ {profile.xp} XP
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Auth Button */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Đồng bộ tài khoản Google
            </button>
          )}
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
              🏆 Thống kê năng lực & Mức độ tiệm cận mục tiêu
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Bài viết đã phân tích</div>
                <div className="font-mono-code text-2xl font-bold text-[#18181B] mt-1">
                  {userPosts.length}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Độ chính xác bài tập</div>
                <div className="font-mono-code text-2xl font-bold text-[#059669] mt-1">
                  {accuracyPct}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6]">
                <div className="text-xs text-[#6E6A63]">Điểm tích lũy</div>
                <div className="font-mono-code text-2xl font-bold text-[#5B3FD9] mt-1">
                  {profile.xp} XP
                </div>
              </div>
            </div>

            {/* Skill Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Grammar Accuracy (Độ chính xác ngữ pháp)</span>
                  <span className="font-mono-code">78% — Tiệm cận 800+ / 7.5</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F3EFEA] overflow-hidden">
                  <div className="h-full bg-[#059669] w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Lexical Resource & Workplace Vocabulary</span>
                  <span className="font-mono-code">82% — Đạt ngưỡng mục tiêu</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F3EFEA] overflow-hidden">
                  <div className="h-full bg-[#5B3FD9] w-[82%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Reading & Listening Paraphrasing</span>
                  <span className="font-mono-code">85% — Vững vàng</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F3EFEA] overflow-hidden">
                  <div className="h-full bg-[#1E40AF] w-[85%]" />
                </div>
              </div>
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
            <p className="text-xs text-[#57534E] leading-relaxed">
              Mỗi khi bạn dùng AI sửa bài viết hoặc làm bài tập, hệ thống tự động ghi nhớ các quy tắc bạn hay nhầm để tạo đề luyện tập riêng.
            </p>
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
              Chưa có lượt làm bài nào được lưu. Hãy hoàn thành 1 bài trong mục <strong>📚 Practice</strong>!
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
              Tập trung vào Vocabulary thương mại, Grammar Part 5/6, Reading Part 7, Listening Part 3/4 và Mini Test thực chiến.
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
            Thông báo cộng đồng & Phản hồi từ AI
          </h1>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6E1D6] bg-white hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" />
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="bg-white border border-[#E6E1D6] rounded-xl divide-y divide-[#E6E1D6]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start gap-3.5 ${
              !n.read ? 'bg-[#FAF8F5]' : 'bg-white'
            }`}
          >
            <img
              src={n.actorAvatar}
              alt={n.actorName}
              className="w-10 h-10 rounded-full object-cover border border-[#E6E1D6]"
              referrerPolicy="no-referrer"
            />
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
    </div>
  );
};
