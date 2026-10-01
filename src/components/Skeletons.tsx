"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-slate-800/80 animate-pulse rounded ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header Skeleton */}
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-8 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mis Partidas DM */}
        <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/60 flex justify-between items-center"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-28 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Mis Personajes */}
        <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/60 flex justify-between items-center"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function CharacterSheetSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Skeleton className="h-4 w-32" />

        {/* Header Ficha */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-9 w-64" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-28 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-6 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded" />
          </div>
        </div>

        {/* Stats & Skills */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <Skeleton className="h-6 w-60 border-b border-slate-800 pb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-900/60 rounded-lg border border-slate-800 p-4 space-y-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full rounded" />
                  <Skeleton className="h-6 w-full rounded" />
                  <Skeleton className="h-6 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combate */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Skeleton className="md:col-span-3 h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>

        {/* Dotes & Inventario */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GameRoomSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Sala */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>

        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 h-96 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-full rounded-lg" />
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 h-96 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-full rounded-lg" />
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-6 h-96 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-800/50 p-8 rounded-xl border border-slate-800 space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
