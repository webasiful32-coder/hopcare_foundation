import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { Search, Calendar, Clock, User, ArrowLeft, Tag, Share2 } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => setPosts(data))
      .catch(() => {});
  }, []);

  const categories = ['All', 'Blood Donation', 'Transparency', 'Disaster Relief', 'Healthcare', 'Community'];

  const filtered = posts.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {readingPost ? (
        /* Reading Post View */
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
          <button
            onClick={() => setReadingPost(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3.5 py-2 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-md font-bold">{readingPost.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {readingPost.publishedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readingPost.readTimeMinutes} min read</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {readingPost.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-b pb-4 border-slate-100">
              <User className="w-4 h-4 text-slate-400" />
              <span>Written by <strong>{readingPost.author}</strong></span>
            </div>
          </div>

          <div className="aspect-16/9 rounded-3xl overflow-hidden bg-slate-100 shadow-md">
            <img src={readingPost.coverImage} alt={readingPost.title} className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm whitespace-pre-line space-y-4 pt-2">
            {readingPost.content}
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-400" />
              {readingPost.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-medium">
                  #{t}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share Article
            </button>
          </div>
        </div>
      ) : (
        /* Blog Feed View */
        <>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Insights & Field Bulletins
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              HopeCare Humanitarian Blog
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Medical knowledge, blood donation protocols, disaster field journals, and transparent reports from our healthcare cells.
            </p>
          </div>

          {/* Search & Category Filter */}
          {/*<div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles by title, blood guidelines, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedCategory === c
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div> */}

          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs w-full max-w-full min-w-0">
          {/* সার্চ ইনপুট */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles by title, blood guidelines, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* flex-wrap: সব ক্যাটাগরি এক নজরে চোখের সামনে থাকবে, ডানে-বামে টানা লাগবে না */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full pt-0.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedCategory === c
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <div
                key={post.id}
                onClick={() => setReadingPost(post)}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col justify-between"
              >
                <div className="aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                      <span className="text-sky-700 font-bold">{post.category}</span>
                      <span>•</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-sky-600 transition line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{post.publishedDate}</span>
                    <span className="font-bold text-sky-600 group-hover:underline">Read Article →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
