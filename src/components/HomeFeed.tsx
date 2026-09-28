import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Sparkles,
  ArrowRight,
  Send,
  PenTool,
  Flame,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AICorrectionItem,
  CommentItem,
  LearningMode,
  Post,
} from '../types';

interface HomeFeedProps {
  posts: Post[];
  commentsByPost: Record<string, CommentItem[]>;
  currentUserId: string;
  learningMode: LearningMode;
  isSavedView?: boolean;
  onToggleLike: (post: Post) => void;
  onToggleSave: (post: Post) => void;
  onAddComment: (post: Post, content: string) => Promise<void>;
  onOpenInWriteStudio: (draft: { title: string; content: string; topicTag: string }) => void;
  onNavigateWrite: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  posts,
  commentsByPost,
  currentUserId,
  learningMode,
  isSavedView = false,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onOpenInWriteStudio,
  onNavigateWrite,
}) => {
  const [feedSubTab, setFeedSubTab] = useState<'latest' | 'featured' | 'community'>('latest');
  const [modeFilter, setModeFilter] = useState<'ALL' | LearningMode>('ALL');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    'seed-post-1': true,
  });
  const [expandedAiDiffs, setExpandedAiDiffs] = useState<Record<string, boolean>>({
    'seed-post-1': true,
    'seed-post-2': true,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);

  const displayedPosts = posts
    .filter((post) => {
      if (isSavedView) {
        return post.savedBy.includes(currentUserId);
      }
      if (modeFilter !== 'ALL' && post.mode !== modeFilter) return false;
      if (feedSubTab === 'featured') return Boolean(post.featured || post.likesCount >= 20);
      return true;
    })
    .sort((a, b) => {
      if (feedSubTab === 'featured' && !isSavedView) {
        return b.likesCount - a.likesCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCommentSubmit = async (post: Post) => {
    const text = (commentInputs[post.id] || '').trim();
    if (!text) return;
    setSubmittingCommentId(post.id);
    try {
      await onAddComment(post, text);
      setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
      setExpandedComments((prev) => ({ ...prev, [post.id]: true }));
    } finally {
      setSubmittingCommentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            <span>{isSavedView ? '❤️ Saved Posts' : '🏠 EnglishHub Community'}</span>
            <span>•</span>
            <span>Học từ bài viết & phân tích lỗi thực tế</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            {isSavedView
              ? 'Bài viết & Cấu trúc hay đã lưu'
              : 'Cộng đồng luyện viết TOEIC 800+ & IELTS 8.0'}
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            {isSavedView
              ? 'Ôn tập lại các bài viết, lỗi ngữ pháp (❌ → ✅) và từ vựng nâng cao bạn đã đánh dấu.'
              : 'Mỗi bài đăng đều đi kèm phân tích lỗi ngữ pháp & từ vựng từ AI để cả cộng đồng cùng tiến bộ.'}
          </p>
        </div>

        {!isSavedView && (
          <button
            type="button"
            onClick={onNavigateWrite}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer self-start md:self-auto"
          >
            <PenTool className="w-4 h-4" />
            ✍️ Viết bài & Nhờ AI sửa lỗi
          </button>
        )}
      </div>

      {/* Home Sub-Navigation: Bài viết mới | Bài viết nổi bật | Feed cộng đồng */}
      {!isSavedView && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-[#E6E1D6] bg-white p-1 gap-1 self-start">
            <button
              type="button"
              onClick={() => setFeedSubTab('latest')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                feedSubTab === 'latest'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Bài viết mới
            </button>
            <button
              type="button"
              onClick={() => setFeedSubTab('featured')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                feedSubTab === 'featured'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#D97706]" />
              Bài viết nổi bật
            </button>
            <button
              type="button"
              onClick={() => setFeedSubTab('community')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                feedSubTab === 'community'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Feed cộng đồng
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#6E6A63] mr-1">Lọc chế độ:</span>
            {(['ALL', 'TOEIC', 'IELTS'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  modeFilter === m
                    ? 'bg-[#F3EFEA] border-[#18181B] text-[#18181B]'
                    : 'bg-white border-[#E6E1D6] text-[#6E6A63] hover:text-[#18181B]'
                }`}
              >
                {m === 'ALL' ? 'Tất cả' : m === 'TOEIC' ? 'TOEIC 800+' : 'IELTS 8.0'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if Saved is empty */}
      {displayedPosts.length === 0 ? (
        <div className="bg-white border border-[#E6E1D6] rounded-xl p-10 text-center space-y-3">
          <Bookmark className="w-8 h-8 text-[#6E6A63] mx-auto" />
          <h3 className="text-lg font-bold text-[#18181B]">
            {isSavedView ? 'Chưa có bài viết nào được lưu' : 'Chưa có bài viết trong mục này'}
          </h3>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            {isSavedView
              ? 'Nhấn biểu tượng 🔖 Lưu bài viết trên bảng tin cộng đồng để lưu lại các bài phân tích ngữ pháp và từ vựng hữu ích.'
              : 'Hãy là người đầu tiên chia sẻ bài viết tiếng Anh của bạn!'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayedPosts.map((post) => {
            const isLiked = post.likedBy.includes(currentUserId);
            const isSaved = post.savedBy.includes(currentUserId);
            const postComments = commentsByPost[post.id] || [];
            const isCommentsOpen = Boolean(expandedComments[post.id]);
            const isAiOpen = expandedAiDiffs[post.id] ?? true;

            let parsedCorrections: AICorrectionItem[] = [];
            if (post.aiCorrectionsJson) {
              try {
                parsedCorrections = JSON.parse(post.aiCorrectionsJson);
              } catch {
                parsedCorrections = [];
              }
            }

            return (
              <article
                key={post.id}
                className="bg-white border border-[#E6E1D6] rounded-xl p-5 md:p-6 shadow-2xs space-y-4"
              >
                {/* Author & Target Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-[#E6E1D6]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#18181B]">
                          {post.authorName}
                        </span>
                        <span
                          className={`font-mono-code text-[11px] font-bold px-2 py-0.5 rounded ${
                            post.mode === 'IELTS'
                              ? 'bg-[#F6F4FF] text-[#5B3FD9]'
                              : 'bg-[#F0F5FF] text-[#1E40AF]'
                          }`}
                        >
                          {post.authorTarget}
                        </span>
                      </div>
                      <div className="text-xs text-[#6E6A63] flex items-center gap-2">
                        <span>{post.topicTag}</span>
                        <span>•</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Score Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs font-bold px-3 py-1 rounded-md bg-[#FAF8F5] border border-[#E6E1D6] text-[#18181B]">
                      📊 {post.aiScore}
                    </span>
                  </div>
                </div>

                {/* Post Title & Original Content */}
                <div className="space-y-2">
                  <h2 className="text-lg md:text-xl font-bold text-[#18181B]">
                    {post.title}
                  </h2>
                  <p className="text-sm md:text-base text-[#18181B] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Embedded AI Pedagogical Breakdown */}
                {parsedCorrections.length > 0 && (
                  <div className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F5] overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAiDiffs((prev) => ({
                          ...prev,
                          [post.id]: !isAiOpen,
                        }))
                      }
                      className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-[#E6E1D6] bg-[#F3EFEA] hover:bg-[#EAE4DC] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#5B3FD9]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                          🤖 AI Sửa Bài & Giải Thích Lỗi ({parsedCorrections.length} điểm cần lưu ý)
                        </span>
                      </div>
                      {isAiOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#57534E]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#57534E]" />
                      )}
                    </button>

                    {isAiOpen && (
                      <div className="p-4 space-y-3">
                        {post.aiSummary && (
                          <p className="text-xs text-[#57534E] leading-relaxed">
                            {post.aiSummary}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-3">
                          {parsedCorrections.map((c, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-lg bg-white border border-[#E6E1D6] space-y-1.5 text-xs md:text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-[#18181B]">{c.category}:</span>
                                <span className="font-mono-code px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] line-through">
                                  ❌ {c.wrong}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#6E6A63]" />
                                <span className="font-mono-code px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-semibold">
                                  {c.right}
                                </span>
                              </div>
                              <div className="text-[#18181B] bg-[#FAF8F5] px-2.5 py-1.5 rounded border-l-3 border-[#059669]">
                                <span className="font-bold text-[#059669]">Correct: </span>
                                {c.correctSentence}
                              </div>
                              <div className="text-[#57534E]">
                                <span className="font-bold text-[#18181B]">Explanation: </span>
                                {c.explanation}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interaction Footer: Like | Comment | Save | Inspect in Studio */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6E1D6]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleLike(post)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        isLiked
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                          : 'bg-white border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#DC2626]' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !isCommentsOpen,
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#E6E1D6] bg-white text-[#57534E] hover:text-[#18181B] transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Bình luận ({postComments.length || post.commentsCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSave(post)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        isSaved
                          ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                          : 'bg-white border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#D97706]' : ''}`} />
                      <span>{isSaved ? 'Đã lưu' : 'Lưu bài'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenInWriteStudio({
                        title: post.title,
                        content: post.content,
                        topicTag: post.topicTag,
                      })
                    }
                    className="text-xs font-semibold text-[#5B3FD9] hover:underline cursor-pointer"
                  >
                    Mở trong ✍️ Write Studio →
                  </button>
                </div>

                {/* Comment Drawer */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-[#E6E1D6] space-y-3">
                    {postComments.length > 0 && (
                      <div className="space-y-2.5">
                        {postComments.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={c.authorAvatar}
                                  alt={c.authorName}
                                  className="w-5 h-5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-xs font-bold text-[#18181B]">
                                  {c.authorName}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#6E6A63]">
                                {new Date(c.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-[#18181B]">{c.content}</p>
                            {c.aiSuggestion && (
                              <p className="text-xs text-[#059669] font-medium pt-0.5">
                                💡 {c.aiSuggestion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post);
                        }}
                        placeholder="Viết bình luận góp ý hoặc thảo luận bằng tiếng Anh / tiếng Việt..."
                        className="flex-1 px-3.5 py-2 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] text-xs md:text-sm text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post)}
                        disabled={
                          submittingCommentId === post.id ||
                          !(commentInputs[post.id] || '').trim()
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18181B] text-white text-xs font-bold hover:bg-[#27272A] transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Gửi
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
