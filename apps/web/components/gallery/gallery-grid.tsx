"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@repo/ui";
import { galleryItems, type GalleryItem } from "@/lib/gallery-data";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Cache-busted image URL — see GalleryItem.version. */
function photoSrc(item: GalleryItem): string {
  return `${item.src}?v=${item.version ?? 1}`;
}

export function GalleryGrid() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (galleryItems.length === 0) return null;

  return (
    <section className="container py-12 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-wide">
          Inside the Academy
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Training <span className="text-primary">gallery</span>
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          A look at real sessions, hands-on labs and batch milestones.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {galleryItems.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            aria-label={`View photo: ${item.title}`}
            className="bg-card focus-visible:ring-ring group relative aspect-square overflow-hidden rounded-2xl border text-left transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2"
          >
            <Image
              src={photoSrc(item)}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 47vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading={i < 4 ? "eager" : "lazy"}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3 pt-10">
              <p className="line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/75">{item.category}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none sm:rounded-2xl">
          {selected && (
            <div className="bg-card overflow-hidden rounded-2xl border">
              <div className="relative aspect-[4/3] w-full bg-black sm:aspect-video">
                {/* Gradient strip so the dialog's close button stays legible over any photo */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/60 to-transparent" />
                <Image
                  src={photoSrc(selected)}
                  alt={selected.title}
                  fill
                  sizes="(min-width: 1024px) 60vw, 90vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="space-y-2 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{selected.title}</h3>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(selected.date)}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selected.description}
                </p>
                <span className="bg-primary/10 text-primary inline-block rounded-full px-2.5 py-1 text-xs font-medium">
                  {selected.category}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
