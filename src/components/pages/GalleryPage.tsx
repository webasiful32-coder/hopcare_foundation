import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../../types';
import { X, ZoomIn, Calendar, Tag } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => {});
  }, []);

  const categories = ['All', 'Health Camp', 'Disaster Relief', 'Blood Drive', 'Education', 'Food Distribution'];
  const filtered = category === 'All' ? items : items.filter((i) => i.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
          Field Photos & Transparencies
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          HopeCare Activity Gallery
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Witness real humanitarian impact on the ground across Bangladesh — from medical boat clinics in remote chars to blood donation camps and disaster relief distributions.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full pt-1 pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              category === c
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItem(item)}
            className="group cursor-pointer rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg">
                  <ZoomIn className="w-5 h-5" />
                </span>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1 text-teal-700 font-bold">
                  <Tag className="w-3 h-3" />
                  {item.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/50 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[70vh] bg-slate-100 flex items-center justify-center p-4">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
            <div className="p-6 bg-white space-y-1">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                {activeItem.category} • {activeItem.date}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{activeItem.title}</h2>
              <p className="text-xs text-slate-600">{activeItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
