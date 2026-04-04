'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface CardCarouselProps {
  cards: React.ReactNode[];
  totalCards?: number;
  /** 챕터별 시작 페이지 인덱스 배열 (예: [0, 1, 4, 9, ...]) */
  chapterBreaks?: number[];
}

export function CardCarousel({ cards, totalCards, chapterBreaks }: CardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const total = totalCards || cards.length;

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;

    if (info.offset.x > swipeThreshold) {
      goToPrevious();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Card Container */}
      <div className="relative overflow-x-hidden min-h-[500px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {cards[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full transition-all ${
            currentIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[var(--surface)] opacity-70 hover:opacity-100'
          }`}
          aria-label="Previous card"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Chapter Indicators */}
        <div className="flex gap-2">
          {chapterBreaks && chapterBreaks.length > 0 ? (
            // 챕터 모드: 챕터별 도트
            chapterBreaks.map((startIdx, chapterIdx) => {
              const nextStart = chapterBreaks[chapterIdx + 1] ?? cards.length;
              const isCurrent = currentIndex >= startIdx && currentIndex < nextStart;
              return (
                <button
                  key={chapterIdx}
                  onClick={() => {
                    setDirection(startIdx > currentIndex ? 1 : -1);
                    setCurrentIndex(startIdx);
                    window.scrollTo(0, 0);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    isCurrent
                      ? 'w-6 bg-[var(--foreground)]'
                      : 'w-2 bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40'
                  }`}
                  aria-label={`챕터 ${chapterIdx + 1}`}
                />
              );
            })
          ) : (
            // 레거시 모드: 개별 도트
            Array.from({ length: total }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (index < cards.length) {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                    window.scrollTo(0, 0);
                  }
                }}
                disabled={index >= cards.length}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-[var(--foreground)]'
                    : index < cards.length
                    ? 'w-2 bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40'
                    : 'w-2 bg-[var(--foreground)]/10 cursor-not-allowed'
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))
          )}
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === cards.length - 1}
          className={`p-3 rounded-full transition-all ${
            currentIndex === cards.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[var(--surface)] opacity-70 hover:opacity-100'
          }`}
          aria-label="Next card"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
