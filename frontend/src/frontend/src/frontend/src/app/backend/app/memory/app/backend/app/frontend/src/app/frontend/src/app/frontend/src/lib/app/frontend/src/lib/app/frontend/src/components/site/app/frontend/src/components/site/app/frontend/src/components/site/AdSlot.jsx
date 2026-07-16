"import React, { useEffect, useState } from \"react\";
import { api } from \"@/lib/api\";

const VARIANTS = {
  leaderboard: \"h-[90px] max-w-[728px] mx-auto my-8\",
  rectangle: \"h-[250px] w-full max-w-[300px] mx-auto my-6\",
  billboard: \"h-[120px] w-full my-6\",
  sidebar: \"h-[600px] w-full max-w-[300px] my-4\",
};

let cachedCfg = null;

export default function AdSlot({ slot = \"header\", variant = \"leaderboard\" }) {
  const [cfg, setCfg] = useState(cachedCfg);

  useEffect(() => {
    if (cachedCfg) return;
    api.get(\"/ads/config\").then(({ data }) => {
      cachedCfg = data;
      setCfg(data);
    }).catch(() => {});
  }, []);

  const html = cfg?.[`${slot}_html`] || \"\";

  return (
    <div
      data-testid={`ad-slot-${slot}`}
      className={`w-full bg-[#111] border border-[#262626] rounded flex flex-col items-center justify-center relative overflow-hidden ${VARIANTS[variant] || VARIANTS.leaderboard}`}
    >
      <span className=\"text-[10px] uppercase tracking-widest text-neutral-600 absolute top-2 right-2\">Publicidade</span>
      {html ? (
        <div className=\"w-full h-full flex items-center justify-center\" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span className=\"text-neutral-600 text-xs font-medium\">Espaço reservado para anúncio</span>
      )}
    </div>
  );
}
"
