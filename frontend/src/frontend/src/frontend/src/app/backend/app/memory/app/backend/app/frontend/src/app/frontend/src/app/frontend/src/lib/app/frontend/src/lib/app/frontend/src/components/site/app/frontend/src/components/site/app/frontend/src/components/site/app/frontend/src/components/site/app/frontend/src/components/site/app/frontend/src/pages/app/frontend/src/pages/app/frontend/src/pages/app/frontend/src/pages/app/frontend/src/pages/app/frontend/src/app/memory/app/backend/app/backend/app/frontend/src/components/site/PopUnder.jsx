"import React, { useEffect, useState } from \"react\";
import { X } from \"lucide-react\";
import { api } from \"@/lib/api\";

const SESSION_KEY = \"mh_popunder_shown_v1\";

export default function PopUnder() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    // Once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    let cancelled = false;
    let timer;
    api.get(\"/ads/config\").then(({ data }) => {
      if (cancelled) return;
      if (!data?.popunder_html?.trim()) return;
      setCfg(data);
      const delay = Math.max(1, Number(data.popunder_delay_seconds || 5)) * 1000;
      timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(SESSION_KEY, \"1\");
      }, delay);
    }).catch(() => {});
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  if (!open || !cfg) return null;

  return (
    <div
      data-testid=\"popunder\"
      className=\"fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-up\"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className=\"relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden\"
      >
        <div className=\"flex items-center justify-between px-5 py-3 border-b border-white/5\">
          <span className=\"text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold\">Publicidade</span>
          <button
            data-testid=\"popunder-close\"
            onClick={() => setOpen(false)}
            className=\"w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center\"
          >
            <X className=\"w-4 h-4\" />
          </button>
        </div>
        <div className=\"p-6 min-h-[300px] flex items-center justify-center\">
          <div className=\"w-full\" dangerouslySetInnerHTML={{ __html: cfg.popunder_html }} />
        </div>
      </div>
    </div>
  );
}
"
