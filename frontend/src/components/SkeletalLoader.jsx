import React from 'react';

// Common Pulse wrapper
export function SkeletonPulse({ className = '', style = {} }) {
  return (
    <div
      className={`bg-secondary bg-opacity-25 rounded position-relative overflow-hidden ${className}`}
      style={{
        animation: 'pulseGlow 1.5s infinite ease-in-out',
        minHeight: '1rem',
        ...style,
      }}
    />
  );
}

// 1. Movie Card Skeleton
export function CardSkeleton() {
  return (
    <div className="glass-panel p-2 d-flex flex-column h-100" style={{ minWidth: '160px', maxWidth: '200px' }}>
      <SkeletonPulse className="w-100 rounded-3 mb-2" style={{ aspectRatio: '2/3' }} />
      <SkeletonPulse className="w-75 mb-1" style={{ height: '1.2rem' }} />
      <SkeletonPulse className="w-50" style={{ height: '0.9rem' }} />
    </div>
  );
}

// 2. Carousel / Row Skeleton
export function CarouselSkeleton({ count = 6 }) {
  return (
    <div className="d-flex gap-3 overflow-hidden py-2 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

// 3. Movie Details page Skeleton
export function DetailsSkeleton() {
  return (
    <div className="container py-5">
      <div className="row g-5">
        
        {/* Banner/Poster space */}
        <div className="col-md-4 text-center">
          <SkeletonPulse className="w-100 rounded-3 mb-3" style={{ aspectRatio: '2/3', maxWidth: '340px' }} />
          <SkeletonPulse className="mx-auto" style={{ width: '120px', height: '2.5rem' }} />
        </div>

        {/* Details text space */}
        <div className="col-md-8">
          <SkeletonPulse className="w-50 mb-3" style={{ height: '3.5rem' }} />
          <div className="d-flex gap-3 mb-4">
            <SkeletonPulse style={{ width: '80px', height: '1.5rem' }} />
            <SkeletonPulse style={{ width: '60px', height: '1.5rem' }} />
            <SkeletonPulse style={{ width: '90px', height: '1.5rem' }} />
          </div>
          
          <SkeletonPulse className="w-100 mb-2" style={{ height: '1.2rem' }} />
          <SkeletonPulse className="w-100 mb-2" style={{ height: '1.2rem' }} />
          <SkeletonPulse className="w-75 mb-4" style={{ height: '1.2rem' }} />

          <hr className="border-secondary-subtle my-4" />

          {/* Cast Circles */}
          <h4 className="mb-3"><SkeletonPulse style={{ width: '150px', height: '2rem' }} /></h4>
          <div className="d-flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="text-center flex-shrink-0" style={{ width: '80px' }}>
                <SkeletonPulse className="rounded-circle mx-auto mb-2" style={{ width: '70px', height: '70px' }} />
                <SkeletonPulse className="mx-auto" style={{ width: '50px', height: '0.8rem' }} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SkeletalLoader({ variant = 'card', count }) {
  if (variant === 'details') return <DetailsSkeleton />;
  if (variant === 'carousel') return <CarouselSkeleton count={count} />;
  return <CardSkeleton />;
}
