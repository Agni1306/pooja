import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { TUTORIAL_CATEGORIES } from '../data/learningData';
import { useAppContext } from '../context/AppContext';
import { Tutorial } from '../types';
import { SafeImage } from '../components/common/SafeImage';
import { learningApi } from '../services/api';

export const LearningCentrePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    authUser,
    tutorials,
    tutorialsLoading,
    tutorialsError,
    refreshTutorials,
    completedLessons,
    toggleLessonCompleted,
    showToast,
  } = useAppContext();

  const initialCat = searchParams.get('category') || 'All';
  const initialLessonId = searchParams.get('lesson');

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openTutorial = async (tut: Tutorial) => {
    setActiveTutorial(tut);
    setDetailLoading(true);
    try {
      const fresh = await learningApi.getByIdOrSlug(tut.slug || tut.id);
      setActiveTutorial(fresh);
    } catch {
      // Keep the already-loaded tutorial preview if detail refresh fails
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);

    const lessonParam = searchParams.get('lesson') || initialLessonId;
    if (lessonParam && tutorials.length > 0 && !activeTutorial) {
      const found = tutorials.find(
        (t) => t.id === lessonParam || t.slug === lessonParam
      );
      if (found) {
        void openTutorial(found);
      }
    }
  }, [activeTutorial, initialLessonId, searchParams, tutorials]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredTutorials = useMemo(() => {
    if (selectedCategory === 'All') return tutorials;
    return tutorials.filter((t) => t.category === selectedCategory);
  }, [selectedCategory, tutorials]);

  const completedCount = useMemo(
    () =>
      tutorials.filter(
        (t) =>
          completedLessons.includes(t.id) ||
          (t.slug ? completedLessons.includes(t.slug) : false)
      ).length,
    [completedLessons, tutorials]
  );

  const completionPercentage =
    tutorials.length > 0
      ? Math.round((completedCount / tutorials.length) * 100)
      : 0;

  const handleToggleCompletion = async (tut: Tutorial) => {
    const key = tut.slug || tut.id;
    setTogglingId(key);
    try {
      await toggleLessonCompleted(key);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to update learning progress.',
        'warning'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const isTutorialDone = (tut: Tutorial) =>
    completedLessons.includes(tut.id) ||
    (tut.slug ? completedLessons.includes(tut.slug) : false);

  return (
    <div className="bg-[#FAF6F0] min-h-screen pb-16">
      {/* Header */}
      <section className="bg-white border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-[#174C3C]">
                Vendor Empowerment Guides
              </p>
              <h1 className="mt-1.5 font-display font-bold text-3xl sm:text-4xl text-[#242D2A]">
                Digital Learning Centre
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#242D2A]/75 max-w-2xl">
                Plain-language, practical lessons designed for street vendors and small shopkeepers—covering UPI payments, online storefronts, photography, and scam prevention.
              </p>
            </div>

            {/* Progress indicator */}
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/12 min-w-[260px]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#242D2A]">
                <span>Your Learning Progress</span>
                <span className="tabular-nums text-[#174C3C]">
                  {completedCount}/{tutorials.length} Lessons
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-[#242D2A]/10 overflow-hidden">
                <div
                  className="h-full bg-[#174C3C] transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              {!authUser && (
                <p className="mt-2 text-[11px] text-[#242D2A]/65">
                  <Link to="/auth" className="font-semibold text-[#174C3C] hover:underline">
                    Sign in
                  </Link>{' '}
                  to save lesson completion to your account.
                </p>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleCategoryClick('All')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-[#174C3C] text-white'
                  : 'bg-[#FAF6F0] text-[#242D2A]/80 hover:bg-[#F5EBDD]'
              }`}
            >
              All Topics ({tutorials.length})
            </button>
            {TUTORIAL_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#174C3C] text-white'
                    : 'bg-[#FAF6F0] text-[#242D2A]/80 hover:bg-[#F5EBDD]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {tutorialsLoading ? (
          <div className="flex items-center justify-center py-20 gap-2.5 text-sm text-[#242D2A]/75">
            <Loader2 className="w-5 h-5 animate-spin text-[#174C3C]" />
            Loading Digital Learning lessons...
          </div>
        ) : tutorialsError ? (
          <div className="bg-white border border-[#E99A43]/40 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-8 h-8 text-[#B96614] mx-auto" />
            <p className="mt-3 font-display font-bold text-lg text-[#242D2A]">
              Unable to load learning materials
            </p>
            <p className="mt-1.5 text-sm text-[#242D2A]/70">{tutorialsError}</p>
            <button
              type="button"
              onClick={() => void refreshTutorials()}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B]"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-10 text-center max-w-lg mx-auto">
            <p className="font-display font-bold text-lg text-[#242D2A]">
              No tutorials found in this category yet
            </p>
            <p className="mt-1.5 text-sm text-[#242D2A]/70">
              Try viewing all topics or ensure learning content has been seeded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tut) => {
              const isCompleted = isTutorialDone(tut);
              return (
                <article
                  key={tut.id}
                  className="bg-white border border-[#242D2A]/12 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-[#F5EBDD] overflow-hidden">
                    <SafeImage
                      src={tut.image}
                      alt={tut.title}
                      fallbackLabel={tut.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Unboxed clean metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#242D2A]/65">
                      <span className="font-semibold text-[#174C3C]">{tut.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tut.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tut.readingTime}</span>
                    </div>

                    <h2 className="mt-2 font-display font-bold text-lg text-[#242D2A] leading-snug">
                      {tut.title}
                    </h2>

                    <p className="mt-2 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                      {tut.summary}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[#242D2A]/10 flex items-center justify-between gap-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174C3C]">
                          <CheckCircle2 className="w-4 h-4 text-[#174C3C]" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs text-[#242D2A]/55">Not started</span>
                      )}

                      <button
                        type="button"
                        onClick={() => void openTutorial(tut)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5EBDD] text-[#174C3C] text-xs font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors whitespace-nowrap"
                      >
                        Read More
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Tutorial Reader Modal */}
      {activeTutorial && (
        <div
          className="fixed inset-0 z-50 bg-[#242D2A]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-modal-title"
        >
          <div className="bg-white border border-[#242D2A]/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-[#242D2A]/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#242D2A]/70 min-w-0">
                <BookOpen className="w-4 h-4 text-[#174C3C] shrink-0" />
                <span className="font-semibold text-[#174C3C] truncate">
                  {activeTutorial.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{activeTutorial.readingTime}</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTutorial(null)}
                aria-label="Close lesson reader"
                className="p-2 rounded-lg text-[#242D2A]/70 hover:bg-[#FAF6F0] hover:text-[#242D2A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2
                  id="tutorial-modal-title"
                  className="font-display font-bold text-2xl sm:text-3xl text-[#242D2A]"
                >
                  {activeTutorial.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#242D2A]/80 leading-relaxed">
                  {activeTutorial.summary}
                </p>
              </div>

              {detailLoading ? (
                <div className="flex items-center gap-2 text-xs text-[#242D2A]/60">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#174C3C]" />
                  Syncing lesson details...
                </div>
              ) : null}

              <div className="space-y-4">
                {activeTutorial.steps.map((step) => (
                  <div
                    key={step.heading}
                    className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10"
                  >
                    <h3 className="font-display font-bold text-base text-[#174C3C]">
                      {step.heading}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#242D2A]/80 leading-relaxed">
                      {step.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {(activeTutorial.keyTip || activeTutorial.avoidTip) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTutorial.keyTip && (
                    <div className="p-4 rounded-xl bg-[#F5EBDD]/60 border border-[#174C3C]/15">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#174C3C]">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        Helpful Habit
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#242D2A]/85 leading-relaxed">
                        {activeTutorial.keyTip}
                      </p>
                    </div>
                  )}

                  {activeTutorial.avoidTip && (
                    <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E99A43]/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#B96614]">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        What to Avoid
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#242D2A]/85 leading-relaxed">
                        {activeTutorial.avoidTip}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[#242D2A]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={togglingId === (activeTutorial.slug || activeTutorial.id)}
                  onClick={() => void handleToggleCompletion(activeTutorial)}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                    isTutorialDone(activeTutorial)
                      ? 'bg-[#F5EBDD] text-[#174C3C] border border-[#174C3C]/20'
                      : 'bg-[#174C3C] text-white hover:bg-[#10372B]'
                  }`}
                >
                  {togglingId === (activeTutorial.slug || activeTutorial.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isTutorialDone(activeTutorial)
                    ? 'Completed (Click to Undo)'
                    : 'Mark Lesson as Completed'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTutorial(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#242D2A]/15 text-sm font-medium text-[#242D2A] hover:bg-[#FAF6F0] transition-colors"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
