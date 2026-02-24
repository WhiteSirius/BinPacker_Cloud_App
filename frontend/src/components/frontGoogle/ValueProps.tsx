import React, { useEffect, useRef, useState } from 'react';

const benefits = [
  {
    value: 60,
    label: 'Reduce loading time by up to',
    suffix: '%',
    durationMs: 1200,
  },
  {
    value: 95,
    label: 'Accuracy vs manual expert packing',
    suffix: '%',
    durationMs: 1200,
  },
  {
    value: 1000,
    label: 'Handle items with cloud scalability',
    suffix: '+',
    durationMs: 650, // faster for large numbers
  },
];

const useCountUp = (end: number, durationMs: number = 1200) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const startTime = performance.now();
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const tick = (now: number) => {
          const t = Math.min(1, (now - startTime) / durationMs);
          const eased = easeOutCubic(t);
          setCount(Math.round(eased * end));
          if (t < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            setCount(end);
          }
        };

        rafId = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [end, durationMs]);

  return { count, ref };
};

const BenefitCard: React.FC<{ value: number; label: string; suffix: string; durationMs: number }> = ({
  value,
  label,
  suffix,
  durationMs,
}) => {
  const { count, ref } = useCountUp(value, durationMs);
  return (
    <div ref={ref} className="bg-transparent p-6 text-center">
      <p className="text-5xl md:text-7xl font-black text-cyan-400 text-glow">
        {count}
        <span className="text-4xl md:text-6xl">{suffix}</span>
      </p>
      <p className="mt-2 text-lg text-slate-300">{label}</p>
    </div>
  );
};

const ValueProps: React.FC = () => {
  return (
    <section id="benefits" className="py-20 bg-slate-900/70">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Proven ROI</h2>
          <p className="text-slate-400 mt-2">Tangible benefits that impact your bottom line.</p>
          <div className="mt-4 w-24 h-1 bg-cyan-500 mx-auto rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;


