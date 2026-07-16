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
