import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  Zap,
  Flame,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
} from 'lucide-react';
import { LearningMode, VocabGamePair, VocabSprintItem } from '../types';

interface VocabGameProps {
  learningMode: LearningMode;
  targetScore: string;
  onModeChange: (mode: LearningMode) => void;
  onAwardXP: (amount: number) => void;
}

const DEFAULT_MATCH_PAIRS: Record<LearningMode, VocabGamePair[]> = {
  TOEIC: [
    {
      id: 'toeic-1',
      word: 'Comply with',
      meaningVi: 'Tuân thủ (quy định, hợp đồng)',
      example: 'All staff must comply with company safety protocols.',
      type: 'word',
    },
    {
      id: 'toeic-2',
      word: 'Mutually beneficial',
      meaningVi: 'Đôi bên cùng có lợi',
      example: 'The merger proved mutually beneficial for both enterprises.',
      type: 'word',
    },
    {
      id: 'toeic-3',
      word: 'Look forward to',
      meaningVi: 'Mong đợi (sau to + V-ing)',
      example: 'We look forward to hearing from you soon.',
      type: 'word',
    },
    {
      id: 'toeic-4',
      word: 'Substantial growth',
      meaningVi: 'Tăng trưởng đáng kể',
      example: 'The Q3 report showed substantial growth in overseas revenue.',
      type: 'word',
    },
    {
      id: 'toeic-5',
      word: 'Contingency plan',
      meaningVi: 'Kế hoạch dự phòng',
      example: 'Management devised a contingency plan in case of supply delays.',
      type: 'word',
    },
    {
      id: 'toeic-6',
      word: 'Reimburse expenses',
      meaningVi: 'Hoàn trả công tác phí',
      example: 'The finance team will reimburse all travel expenses.',
      type: 'word',
    },
  ],
  IELTS: [
    {
      id: 'ielts-1',
      word: 'Exacerbate',
      meaningVi: 'Làm trầm trọng thêm',
      example: 'Unregulated urban expansion exacerbates traffic congestion.',
      type: 'word',
    },
    {
      id: 'ielts-2',
      word: 'Mitigate the effects',
      meaningVi: 'Giảm thiểu các tác động tiêu cực',
      example: 'Green initiatives help mitigate the effects of global warming.',
      type: 'word',
    },
    {
      id: 'ielts-3',
      word: 'Gain prevalence',
      meaningVi: 'Trở nên phổ biến rộng rãi',
      example: 'Remote working arrangements have gained prevalence globally.',
      type: 'word',
    },
    {
      id: 'ielts-4',
      word: 'Growing consensus',
      meaningVi: 'Sự đồng thuận ngày càng tăng',
      example: 'There is a growing consensus on prioritizing renewable energy.',
      type: 'word',
    },
    {
      id: 'ielts-5',
      word: 'Cognitive faculties',
      meaningVi: 'Năng lực nhận thức tư duy',
      example: 'Language immersion stimulates senior cognitive faculties.',
      type: 'word',
    },
    {
      id: 'ielts-6',
      word: 'Intrinsic motivation',
      meaningVi: 'Động lực tự thân / nội tại',
      example: 'Intrinsic motivation yields deeper academic achievement.',
      type: 'word',
    },
  ],
};

const DEFAULT_SPRINT_QUESTIONS: Record<LearningMode, VocabSprintItem[]> = {
  TOEIC: [
    {
      id: 's-t1',
      sentence: 'All prospective suppliers must _______ with strict quality assurance standards.',
      missingPart: 'comply',
      options: ['comply', 'abide', 'obey', 'follow'],
      correctIndex: 0,
      explanation: 'Đi kèm giới từ "with" mang nghĩa tuân thủ quy định: comply with (abide by, adhere to).',
    },
    {
      id: 's-t2',
      sentence: 'We look forward to _______ the revised proposal at tomorrow morning’s meeting.',
      missingPart: 'discussing',
      options: ['discuss', 'discussing', 'discussion', 'discussed'],
      correctIndex: 1,
      explanation: 'Trong cụm "look forward to", từ "to" là giới từ nên theo sau bắt buộc là V-ing.',
    },
    {
      id: 's-t3',
      sentence: 'The board approved the budget _______ the unexpected decline in raw material costs.',
      missingPart: 'despite',
      options: ['although', 'despite', 'even though', 'whereas'],
      correctIndex: 1,
      explanation: 'Theo sau là một cụm danh từ ("the unexpected decline...") nên phải dùng giới từ "despite".',
    },
  ],
  IELTS: [
    {
      id: 's-i1',
      sentence: 'Failing to upgrade public transport will inevitably _______ severe urban gridlock.',
      missingPart: 'exacerbate',
      options: ['exacerbate', 'mitigate', 'diminish', 'remedy'],
      correctIndex: 0,
      explanation: '"Exacerbate" là từ vựng Band 8.0 mang nghĩa làm trầm trọng thêm vấn đề tiêu cực.',
    },
    {
      id: 's-i2',
      sentence: 'Not only _______ carbon emissions, but electric vehicles also reduce urban noise pollution.',
      missingPart: 'do they curb',
      options: ['they curb', 'do they curb', 'curb they', 'have they curbed'],
      correctIndex: 1,
      explanation: 'Cấu trúc đảo ngữ với "Not only" đứng đầu câu: Not only + Trợ động từ + S + V.',
    },
    {
      id: 's-i3',
      sentence: 'The researchers observed a _______ consensus regarding the correlation between sleep and memory.',
      missingPart: 'growing',
      options: ['growing', 'grow', 'growth', 'grew'],
      correctIndex: 0,
      explanation: 'Collocation học thuật chuẩn C1/C2: "a growing consensus" (sự đồng thuận ngày càng tăng).',
    },
  ],
};

interface Tile {
  id: string;
  pairId: string;
  text: string;
  type: 'word' | 'meaning';
  matched: boolean;
  selected: boolean;
}

export const VocabGame: React.FC<VocabGameProps> = ({
  learningMode,
  targetScore,
  onModeChange,
  onAwardXP,
}) => {
  const [gameMode, setGameMode] = useState<'match' | 'sprint'>('match');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Match Game state
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [firstSelected, setFirstSelected] = useState<Tile | null>(null);
  const [matchPairs, setMatchPairs] = useState<VocabGamePair[]>(
    DEFAULT_MATCH_PAIRS[learningMode]
  );

  // Sprint Game state
  const [sprintQuestions, setSprintQuestions] = useState<VocabSprintItem[]>(
    DEFAULT_SPRINT_QUESTIONS[learningMode]
  );
  const [currentSprintIndex, setCurrentSprintIndex] = useState(0);
  const [selectedSprintOption, setSelectedSprintOption] = useState<number | null>(null);
  const [showSprintExplanation, setShowSprintExplanation] = useState(false);

  useEffect(() => {
    setMatchPairs(DEFAULT_MATCH_PAIRS[learningMode]);
    setSprintQuestions(DEFAULT_SPRINT_QUESTIONS[learningMode]);
    resetGame();
  }, [learningMode]);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isGameActive && timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [isGameActive, timeLeft]);

  const initMatchTiles = (pairs: VocabGamePair[]) => {
    const rawTiles: Tile[] = [];
    pairs.forEach((p) => {
      rawTiles.push({
        id: `${p.id}-w`,
        pairId: p.id,
        text: p.word,
        type: 'word',
        matched: false,
        selected: false,
      });
      rawTiles.push({
        id: `${p.id}-m`,
        pairId: p.id,
        text: p.meaningVi,
        type: 'meaning',
        matched: false,
        selected: false,
      });
    });

    // Shuffle tiles
    const shuffled = rawTiles.sort(() => Math.random() - 0.5);
    setTiles(shuffled);
  };

  const startMatchGame = () => {
    initMatchTiles(matchPairs);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setIsGameActive(true);
    setFirstSelected(null);
  };

  const startSprintGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(45);
    setCurrentSprintIndex(0);
    setSelectedSprintOption(null);
    setShowSprintExplanation(false);
    setIsGameOver(false);
    setIsGameActive(true);
  };

  const resetGame = () => {
    setIsGameActive(false);
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setFirstSelected(null);
  };

  const handleGameOver = () => {
    setIsGameActive(false);
    setIsGameOver(true);
    const xpEarned = Math.round(score / 5) + (maxCombo * 5);
    if (xpEarned > 0) {
      onAwardXP(xpEarned);
    }
  };

  const handleTileClick = (tile: Tile) => {
    if (!isGameActive || tile.matched || tile.selected) return;

    // First tile selection
    if (!firstSelected) {
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, selected: true } : t))
      );
      setFirstSelected(tile);
      return;
    }

    // Second tile selection
    // Can only match word with meaning
    if (firstSelected.type === tile.type) {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === firstSelected.id
            ? { ...t, selected: false }
            : t.id === tile.id
            ? { ...t, selected: true }
            : t
        )
      );
      setFirstSelected(tile);
      return;
    }

    // Check match
    if (firstSelected.pairId === tile.pairId) {
      // MATCH SUCCESS
      const nextCombo = combo + 1;
      const points = 100 * nextCombo;
      setScore((prev) => prev + points);
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      setTiles((prev) =>
        prev.map((t) =>
          t.pairId === tile.pairId ? { ...t, matched: true, selected: false } : t
        )
      );
      setFirstSelected(null);

      // Check if all matched
      const allMatched = tiles.filter((t) => !t.matched && t.pairId !== tile.pairId).length === 0;
      if (allMatched) {
        setScore((prev) => prev + 500); // Speed clear bonus
        handleGameOver();
      }
    } else {
      // MISMATCH
      setCombo(0);
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, selected: true } : t))
      );
      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) =>
            t.id === firstSelected.id || t.id === tile.id
              ? { ...t, selected: false }
              : t
          )
        );
        setFirstSelected(null);
      }, 500);
    }
  };

  const handleSprintOptionClick = (optionIdx: number) => {
    if (!isGameActive || showSprintExplanation) return;
    setSelectedSprintOption(optionIdx);
    setShowSprintExplanation(true);

    const currentQ = sprintQuestions[currentSprintIndex];
    if (optionIdx === currentQ.correctIndex) {
      const nextCombo = combo + 1;
      setScore((prev) => prev + 120 * nextCombo);
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
    } else {
      setCombo(0);
    }
  };

  const handleNextSprintQuestion = () => {
    if (currentSprintIndex + 1 < sprintQuestions.length) {
      setCurrentSprintIndex((prev) => prev + 1);
      setSelectedSprintOption(null);
      setShowSprintExplanation(false);
    } else {
      handleGameOver();
    }
  };

  const handleGenerateAIPairs = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-vocab-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: learningMode, gameType: gameMode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (gameMode === 'match' && Array.isArray(data) && data.length > 0) {
          setMatchPairs(data);
          initMatchTiles(data);
          resetGame();
        } else if (gameMode === 'sprint' && Array.isArray(data) && data.length > 0) {
          setSprintQuestions(data);
          resetGame();
        }
      }
    } catch (err) {
      console.error('Error generating game challenge:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            <span className="flex items-center gap-1.5 text-[#D97706]">
              <Gamepad2 className="w-4 h-4" />
              EnglishHub Gamified Learning
            </span>
            <span>•</span>
            <span>Đấu trường Từ vựng & Collocation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            Trò chơi Học Từ vựng {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Vừa chơi vừa ghi nhớ sâu các cụm từ vựng C1/C2 và Collocation thương mại có mặt trong đề thi thực tế.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-[#E6E1D6] p-0.5 bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => onModeChange('TOEIC')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                learningMode === 'TOEIC'
                  ? 'bg-[#1E40AF] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              TOEIC 800+
            </button>
            <button
              type="button"
              onClick={() => onModeChange('IELTS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                learningMode === 'IELTS'
                  ? 'bg-[#5B3FD9] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              IELTS 8.0
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateAIPairs}
            disabled={isGeneratingAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D6D1C7] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#18181B] transition cursor-pointer disabled:opacity-50"
            title="Sinh câu hỏi game ngẫu nhiên bằng Gemini 3.8 Flash"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            {isGeneratingAI ? 'Đang tạo...' : '🎲 Đổi đề mới bằng AI'}
          </button>
        </div>
      </div>

      {/* Game Mode Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl border border-[#E6E1D6] p-1 bg-white">
          <button
            type="button"
            onClick={() => {
              setGameMode('match');
              resetGame();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              gameMode === 'match'
                ? 'bg-[#18181B] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Ghép cặp Siêu tốc (Speed Match)
          </button>
          <button
            type="button"
            onClick={() => {
              setGameMode('sprint');
              resetGame();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              gameMode === 'sprint'
                ? 'bg-[#18181B] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#D97706]" />
            Chạy nước rút Collocation (Word Sprint)
          </button>
        </div>

        {/* Live Scoreboard Header */}
        {isGameActive && (
          <div className="flex items-center gap-4 bg-white border border-[#E6E1D6] px-4 py-2 rounded-xl text-xs font-bold">
            <div className="flex items-center gap-1.5 text-[#D97706]">
              <Clock className="w-4 h-4" />
              <span className="font-mono-code text-sm">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#059669]">
              <Trophy className="w-4 h-4" />
              <span className="font-mono-code text-sm">{score} pts</span>
            </div>
            {combo > 1 && (
              <div className="flex items-center gap-1 text-[#DC2626] font-mono-code animate-bounce">
                🔥 {combo}x COMBO!
              </div>
            )}
          </div>
        )}
      </div>

      {/* GAME ARENA VIEW */}
      {!isGameActive && !isGameOver ? (
        /* Intro Card */
        <div className="bg-white border border-[#E6E1D6] rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto shadow-xs">
            {gameMode === 'match' ? (
              <Zap className="w-8 h-8" />
            ) : (
              <Flame className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#18181B]">
              {gameMode === 'match'
                ? `Thử Thách Ghép Cặp Từ Vựng (${
                    learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
                  })`
                : `Thử Thách Collocation Sprint (${
                    learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
                  })`}
            </h2>
            <p className="text-sm text-[#57534E] leading-relaxed max-w-md mx-auto">
              {gameMode === 'match'
                ? 'Tìm và ghép chính xác các cặp Từ vựng cao cấp với Nghĩa tiếng Việt tương ứng. Ghép liên tiếp không sai để kích hoạt Combo nhân điểm!'
                : 'Đọc câu văn và chọn nhanh từ còn thiếu trong 45 giây. Hoàn thành chính xác để tích lũy XP thăng hạng.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E1D6] text-xs">
            <div>
              <div className="text-[#6E6A63]">Thời gian</div>
              <div className="font-bold text-[#18181B] text-sm mt-0.5">
                {gameMode === 'match' ? '60 giây' : '45 giây'}
              </div>
            </div>
            <div>
              <div className="text-[#6E6A63]">Độ khó</div>
              <div className="font-bold text-[#5B3FD9] text-sm mt-0.5">
                {learningMode === 'IELTS' ? 'Band 8.0' : '800+ PTS'}
              </div>
            </div>
            <div>
              <div className="text-[#6E6A63]">Phần thưởng</div>
              <div className="font-bold text-[#059669] text-sm mt-0.5">+50 ~ 150 XP</div>
            </div>
          </div>

          <button
            type="button"
            onClick={gameMode === 'match' ? startMatchGame : startSprintGame}
            className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-base shadow-sm hover:shadow transition cursor-pointer flex items-center justify-center gap-2 ${
              learningMode === 'IELTS'
                ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            Bắt đầu chơi ngay
          </button>
        </div>
      ) : isGameOver ? (
        /* Game Over Screen */
        <div className="bg-white border border-[#E6E1D6] rounded-2xl p-8 md:p-10 text-center max-w-lg mx-auto space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#18181B]">Vòng Đấu Hoàn Tất!</h2>
            <p className="text-sm text-[#57534E]">
              Bạn đã thể hiện phản xạ từ vựng xuất sắc ở trình độ {targetScore}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D6]">
            <div>
              <div className="text-xs text-[#6E6A63]">Tổng điểm</div>
              <div className="font-mono-code text-2xl font-bold text-[#059669] mt-1">
                {score}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E6A63]">Combo cao nhất</div>
              <div className="font-mono-code text-2xl font-bold text-[#D97706] mt-1">
                {maxCombo}x
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={gameMode === 'match' ? startMatchGame : startSprintGame}
              className="w-full flex-1 py-3 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
              Chơi lại
            </button>
            <button
              type="button"
              onClick={handleGenerateAIPairs}
              disabled={isGeneratingAI}
              className="w-full flex-1 py-3 px-4 rounded-xl border border-[#D6D1C7] bg-white hover:bg-[#FAF8F5] text-[#18181B] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              Đổi bộ từ vựng mới (AI)
            </button>
          </div>
        </div>
      ) : gameMode === 'match' ? (
        /* MODE 1: SPEED MATCH GRID */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tiles.map((tile) => {
              let tileStyle =
                'bg-white border-[#E6E1D6] text-[#18181B] hover:border-[#18181B]';

              if (tile.matched) {
                tileStyle =
                  'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] opacity-40 pointer-events-none scale-95';
              } else if (tile.selected) {
                tileStyle =
                  learningMode === 'IELTS'
                    ? 'bg-[#F6F4FF] border-[#5B3FD9] text-[#5B3FD9] font-bold scale-105 shadow-sm'
                    : 'bg-[#F0F5FF] border-[#1E40AF] text-[#1E40AF] font-bold scale-105 shadow-sm';
              }

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  className={`p-4 rounded-xl border text-sm font-semibold text-center transition min-h-[96px] flex flex-col items-center justify-center cursor-pointer shadow-2xs ${tileStyle}`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">
                    {tile.type === 'word' ? 'English' : 'Tiếng Việt'}
                  </span>
                  <span>{tile.text}</span>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGameOver}
              className="text-xs text-[#6E6A63] hover:text-[#DC2626] font-semibold underline cursor-pointer"
            >
              Dừng vòng đấu sớm
            </button>
          </div>
        </div>
      ) : (
        /* MODE 2: WORD SPRINT / COLLOCATION CHALLENGE */
        <div className="max-w-2xl mx-auto bg-white border border-[#E6E1D6] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6E6A63] font-semibold">
            <span>
              Câu {currentSprintIndex + 1} / {sprintQuestions.length}
            </span>
            <span className="font-mono-code text-[#D97706]">⏱ {timeLeft}s</span>
          </div>

          {/* Sentence Stem */}
          <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D6] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">
              Chọn từ thích hợp điền vào chỗ trống:
            </span>
            <p className="text-lg font-bold text-[#18181B] leading-relaxed font-serif">
              {sprintQuestions[currentSprintIndex].sentence}
            </p>
          </div>

          {/* 4 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sprintQuestions[currentSprintIndex].options.map((opt, optIdx) => {
              const currentQ = sprintQuestions[currentSprintIndex];
              const isChosen = selectedSprintOption === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;

              let btnStyle =
                'bg-white border-[#E6E1D6] text-[#18181B] hover:border-[#18181B]';

              if (showSprintExplanation) {
                if (isCorrect) {
                  btnStyle = 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold';
                } else if (isChosen && !isCorrect) {
                  btnStyle = 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] line-through';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={showSprintExplanation}
                  onClick={() => handleSprintOptionClick(optIdx)}
                  className={`p-4 rounded-xl border text-sm font-semibold text-left transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>
                    <strong className="font-mono-code mr-2">
                      {String.fromCharCode(65 + optIdx)}.
                    </strong>
                    {opt}
                  </span>
                  {showSprintExplanation && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  )}
                  {showSprintExplanation && isChosen && !isCorrect && (
                    <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {showSprintExplanation && (
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D6] space-y-3">
              <div className="text-xs text-[#18181B] leading-relaxed">
                <strong>Giải thích: </strong>
                {sprintQuestions[currentSprintIndex].explanation}
              </div>
              <button
                type="button"
                onClick={handleNextSprintQuestion}
                className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
