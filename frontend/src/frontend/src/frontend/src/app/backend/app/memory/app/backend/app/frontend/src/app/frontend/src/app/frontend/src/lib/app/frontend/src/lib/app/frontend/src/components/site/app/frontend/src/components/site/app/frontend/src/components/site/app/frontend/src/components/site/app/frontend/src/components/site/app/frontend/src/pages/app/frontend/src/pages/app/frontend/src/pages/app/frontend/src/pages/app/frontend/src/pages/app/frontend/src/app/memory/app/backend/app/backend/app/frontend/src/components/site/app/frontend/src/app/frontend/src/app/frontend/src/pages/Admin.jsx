function AdSection() {
  const [cfg, setCfg] = useState({
    header_html: \"\", sidebar_html: \"\", in_content_html: \"\", pre_player_html: \"\",
    popunder_html: \"\", popunder_delay_seconds: 5,
  });
  useEffect(() => { api.get(\"/ads/config\").then(({ data }) => setCfg(data)); }, []);
  const save = async () => {
    try {
      await api.put(\"/ads/config\", { ...cfg, popunder_delay_seconds: Number(cfg.popunder_delay_seconds) || 5 });
      toast.success(\"Anúncios salvos\");
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div data-testid=\"ads-section\" className=\"bg-[#111] border border-white/5 rounded-xl p-6 space-y-6\">
      <div>
        <h3 className=\"font-display text-xl font-bold uppercase tracking-tight mb-1\">Slots de Anúncio</h3>
        <p className=\"text-xs text-neutral-500\">Cole código HTML de qualquer rede (AdSense, banners, scripts).</p>
      </div>
      <div className=\"grid md:grid-cols-2 gap-4\">
        {[\"header\", \"sidebar\", \"in_content\", \"pre_player\"].map((k) => (
          <div key={k}>
            <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">{k.replace(\"_\", \" \")}</label>
            <textarea
              data-testid={`ad-${k}`}
              rows={3}
              placeholder=\"<ins class='adsbygoogle' ...></ins>\"
              value={cfg[`${k}_html`] || \"\"}
              onChange={(e) => setCfg({ ...cfg, [`${k}_html`]: e.target.value })}
              className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-xs font-mono outline-none focus:border-[#E50914]\"
            />
          </div>
        ))}
      </div>

      <div className=\"border-t border-white/5 pt-4\">
        <div className=\"flex items-center justify-between mb-2\">
          <div>
            <div className=\"font-bold text-sm\">Pop-under Interstitial</div>
            <div className=\"text-xs text-neutral-500\">Aparece 1× por sessão do visitante. Deixe vazio para desativar.</div>
          </div>
          <div>
            <label className=\"block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1\">Delay (s)</label>
            <input
              data-testid=\"ad-popunder-delay\"
              type=\"number\" min={1} max={60}
              value={cfg.popunder_delay_seconds || 5}
              onChange={(e) => setCfg({ ...cfg, popunder_delay_seconds: e.target.value })}
              className=\"w-20 bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\"
            />
          </div>
        </div>
        <textarea
          data-testid=\"ad-popunder\"
          rows={4}
          placeholder=\"<script>...</script> ou <a href='...'><img.../></a>\"
          value={cfg.popunder_html || \"\"}
          onChange={(e) => setCfg({ ...cfg, popunder_html: e.target.value })}
          className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-xs font-mono outline-none focus:border-[#E50914]\"
        />
      </div>

      <button data-testid=\"ads-save\" onClick={save} className=\"bg-[#E50914] hover:bg-[#B80710] font-bold text-sm px-5 py-2.5 rounded-full transition-colors\">Salvar Anúncios</button>
    </div>
