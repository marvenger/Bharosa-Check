(() => {
  // src/rules.js
  var RULES = [
    { id: "guarantee", w: 30, neg: 1, re: /guarantee\w*|assured (return|profit)s?|fixed returns?|risk[- ]?free|zero risk|no risk|100% (profit|accuracy|sure|safe)|sure[- ]?shot|गारंटी|पक्का (मुनाफ़ा|मुनाफा|रिटर्न|प्रॉफिट)|pakka (profit|return|munafa)|100% (पक्का|सही)/gi },
    { id: "unreal", w: 25, re: /\b\d{2,3}\s*%[^.\n]{0,30}?(daily|weekly|monthly|per (day|week|month)|every (day|week|month)|हर (दिन|हफ्ते|महीने)|प्रति (दिन|सप्ताह|माह)|har (din|hafte|mahine))|double (your )?money|\b\d{1,2}x (returns?|profit)|दोगुना|double paisa/gi },
    { id: "rush", w: 15, re: /today only|limited (seats|slots|time|offer)|only \d+ (seats|slots|spots)|last chance|hurry|act now|join (now|today|fast)|expires? (today|soon)|within \d+ (hours?|minutes?)|सिर्फ आज|सीमित सीट|जल्दी (करें|कीजिए)|jaldi (karo|kare)/gi },
    { id: "app", w: 30, re: /\.apk\b|anydesk|teamviewer|quick ?support|rustdesk|screen ?shar\w*|(install|download)\s+(this |our |the |my )?(app|apk|software)|(ऐप|एप|ऐप्प)\s*(डाउनलोड|इंस्टॉल)/gi },
    { id: "fee", w: 25, re: /(pay|send|deposit|transfer)[^.\n]{0,40}(fee|charges?|tax|deposit|margin)|(fee|charges?|tax)[^.\n]{0,25}(to (release|unlock|withdraw)|before withdraw)|(फीस|शुल्क|टैक्स|चार्ज)[^.\n]{0,40}(भेजें|जमा|दें|भरें)|fees?\s*(bhejo|jama)/gi },
    { id: "upi", w: 20, re: /[\w.\-]{2,}@(ybl|ibl|axl|okaxis|okhdfcbank|oksbi|okicici|paytm|apl)\b/gi },
    { id: "otp", w: 35, re: /(?<!never |not |n't )(send|share|give|tell|forward) (us |me |your |the )?(otp|pin|cvv|password)|ओटीपी (बताएं|भेजें|शेयर)|otp (batao|bhejo)/gi },
    { id: "group", w: 12, re: /(whatsapp|telegram)\s+(group|channel)|\bvip\b|premium (group|tips?|calls?)|t\.me\/|chat\.whatsapp\.com|wa\.me\/|ग्रुप जॉइन/gi },
    { id: "tip", w: 15, re: /(buy|sell) (above|below|at|call)|target\s*(price|:)|stop[- ]?loss|jackpot|multibagger|operator|insider|upper circuit/gi },
    { id: "approval", w: 20, neg: 1, re: /(sebi|nse|bse|rbi|government)[ -](approved|certified|authori[sz]ed|official|backed)|सेबी\s*(से\s*)?(मान्यता|प्रमाणित)/gi },
    { id: "secret", w: 15, re: /don'?t tell|do not tell|keep (this |it )?(a )?(secret|confidential)|tell no one|किसी को (मत|न) बताना?|kisi ko mat batana/gi },
    { id: "blocked", w: 30, re: /(withdraw\w*|funds?|money)[^.\n]{0,30}(blocked|frozen|stuck|on hold)|recover (your |the )?(lost |stuck )?(money|funds)|fund recovery|get your money back|(पैसा|रकम|निकासी)[^.\n]{0,30}(ब्लॉक|रुक|फ्रीज)/gi },
    { id: "proof", w: 12, re: /\bI (made|earned|booked)\b[^.\n]{0,12}\d[\d,]{3,}|profit (of|booked)\s*(rs\.?|₹)?\s*\d[\d,]{3,}|मैंने[^.\n]{0,15}कमाए/gi }
  ];
  var BRANDS = { zerodha: "zerodha.com", groww: "groww.in", upstox: "upstox.com", angelone: "angelone.in", icicidirect: "icicidirect.com", hdfcsec: "hdfcsec.com", kotaksecurities: "kotaksecurities.com", "5paisa": "5paisa.com", sharekhan: "sharekhan.com", paytmmoney: "paytmmoney.com", nseindia: "nseindia.com", bseindia: "bseindia.com", sebi: "sebi.gov.in", motilaloswal: "motilaloswal.com" };
  var BADTLD = /\.(xyz|top|vip|club|site|online|icu|cc|live|buzz|shop|click|link)$/;
  var SHORT = /^(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|t\.co|is\.gd|shorturl\.at)$/;
  var VALID = /[\w.\-]+@valid\w*/gi;

  // src/engine.js
  var lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  var NEG = /\b(no|not|never|cannot|can't|doesn't|isn't|without)\b(\s+\w+){0,3}\s*$/i;
  var DOM = /(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,24})\b(?!@)(?:\/[^\s]*)?/gi;
  var REG = /sebi[- ]*(registered|regd\.?)|registered (with|by) sebi|\breg\.? ?no\b|sebi (reg|registration) (no|number)/i;
  var level = (s) => s >= 55 ? "hi" : s >= 20 ? "mid" : "lo";
  var combine = (f) => Math.round(100 * (1 - f.reduce((p, x) => p * (1 - x.w / 100), 1)));
  function analyze(raw) {
    const text = raw.replace(/[’‘]/g, "'"), flags = [], marks = [], notes = [];
    const mk = (i, n, w) => marks.push([i, i + n, w >= 25 ? "h" : "m"]);
    const hit = (id, w, ev, i, n, p = {}) => {
      flags.push({ id, w, ev: [ev], p });
      mk(i, n, w);
    };
    for (const r of RULES) {
      const ev = /* @__PURE__ */ new Set();
      for (const m of text.matchAll(r.re)) {
        if (r.neg && NEG.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
        ev.add(m[0].trim());
        mk(m.index, m[0].length, r.w);
      }
      if (ev.size) flags.push({ id: r.id, w: r.w, ev: [...ev].slice(0, 3), p: {} });
    }
    const nums = [...text.matchAll(/\bIN[AHZMPBDCEFKLNRSTUVWY]\d+\b/gi)];
    for (const m of nums) {
      const d = m[0].slice(3);
      if (d.length !== 9 || /^0+$/.test(d)) hit("regbad", 30, m[0], m.index, m[0].length, { r: m[0] });
      else {
        notes.push({ id: "regok", p: { r: m[0] } });
        mk(m.index, m[0].length, 12);
      }
    }
    const c = text.match(REG);
    if (!nums.length && c) hit("regnone", 20, c[0], c.index, c[0].length);
    for (const m of text.matchAll(VALID)) notes.push({ id: "validok", p: { h: m[0] } });
    const seen = {};
    for (const m of text.matchAll(DOM)) {
      const h = m[1].toLowerCase();
      if (seen[h] || /^(t\.me|wa\.me|chat\.whatsapp\.com)$/.test(h)) continue;
      seen[h] = 1;
      if (Object.values(BRANDS).some((d) => h === d || h.endsWith("." + d))) {
        notes.push({ id: "siteok", p: { h } });
        continue;
      }
      const n = h.replace(/0/g, "o").replace(/1/g, "l").replace(/rn/g, "m");
      let b = null;
      for (const k of Object.keys(BRANDS)) if (n.includes(k) || k.length > 4 && n.split(/[.-]/).some((l) => l.length > 3 && lev(l, k) <= (k.length > 6 ? 2 : 1))) {
        b = k;
        break;
      }
      if (b) hit("lookalike", 40, h, m.index, m[0].length, { h, b, d: BRANDS[b] });
      else if (SHORT.test(h)) hit("short", 10, h, m.index, m[0].length, { h });
      if (BADTLD.test(h)) hit("tld", 15, h, m.index, m[0].length, { h });
    }
    return { text, flags, marks, notes, score: combine(flags) };
  }
  var TS = /^\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]m)?\]?\s*-?\s*([^:]{1,40}):\s*(.*)$/i;
  function parseChat(raw) {
    const m = [];
    for (const line of raw.split(/\r?\n/)) {
      const x = line.match(TS);
      if (x) m.push({ who: x[1].trim(), text: x[2] });
      else if (line.trim()) {
        if (m.length) m[m.length - 1].text += "\n" + line;
        else m.push({ who: "?", text: line });
      }
    }
    return m.length > 1 ? m : raw.split(/\n\s*\n/).filter((s) => s.trim()).map((text) => ({ who: "?", text }));
  }
  function analyzeGroup(raw) {
    const msgs = parseChat(raw).map((m) => ({ ...m, r: analyze(m.text) })), by = {};
    msgs.forEach((m) => m.r.flags.forEach((f) => {
      (by[f.id] ??= { w: f.w, c: 0 }).c++;
    }));
    const flags = Object.entries(by).map(([id, v]) => ({ id, w: v.w, ev: [], p: { c: v.c } }));
    const tip = msgs.filter((m) => m.r.flags.some((f) => ["tip", "guarantee", "unreal"].includes(f.id)));
    if (msgs.length >= 4 && tip.length / msgs.length >= 0.3) flags.push({ id: "tipheavy", w: 15, ev: [], p: { n: tip.length, t: msgs.length } });
    const cnt = {};
    tip.forEach((m) => cnt[m.who] = (cnt[m.who] || 0) + 1);
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (top && top[0] !== "?" && tip.length >= 3 && top[1] / tip.length >= 0.7) flags.push({ id: "onevoice", w: 10, ev: [], p: { who: top[0], n: top[1] } });
    return { msgs, flags, score: combine(flags), senders: new Set(msgs.map((m) => m.who)).size, risky: msgs.filter((m) => m.r.score >= 20).length };
  }

  // src/locales/en.js
  var en_default = {
    ui: {
      tag: 'Paste a suspicious message, link or "tip", or upload a screenshot. Get a plain-language, explainable check before you pay or install anything.',
      priv: "Private by design. Checking runs on your device. Your message is never uploaded or saved.",
      t_chk: "Check a message",
      t_grp: "Check a group chat",
      t_paid: "I already paid",
      lab: "Message, tip or link to check",
      ph: "Paste the text from WhatsApp, Telegram, SMS or email here...",
      go: "Check now",
      clr: "Clear",
      shot: "Upload screenshot",
      try: "Try an example:",
      a: '"VIP tips" group',
      b: "Blocked withdrawal",
      c: "Genuine SIP reminder",
      d: "Hindi scam message",
      empty: "Please paste the full message first. Short fragments are hard to check.",
      ocr: "Reading the screenshot on your device...",
      ocrfail: "Could not read the screenshot (it needs a one-time download, so go online once). Please paste the text instead.",
      v_hi: "High risk",
      v_hiS: "Do not pay, install or share anything.",
      v_mid: "Be careful",
      v_midS: "Some warning signs found. Verify before you act.",
      v_lo: "No major red flags found",
      v_loS: "This is not a guarantee of safety.",
      score: "Risk signals: {s} out of 100. Warning signs found: {n}.",
      read: "Read aloud",
      copy: "Copy summary",
      copied: "Copied",
      nocopy: "Copy not available",
      looked: "What we looked at",
      hl: "Highlights show exactly where each warning sign was found.",
      signs: "Warning signs",
      found: "Found:",
      ser: "Serious",
      warn: "Warning",
      noted: "Also noticed",
      todo: "What to do now",
      sure: "How sure are we?",
      sureT: "This check uses fixed, visible rules, not guesses. A high score does not prove fraud, and a low score does not prove safety. It gives no investment advice.",
      glab: 'Paste a group chat (WhatsApp "Export chat" text works best)',
      gph: "Paste the chat here...",
      ggo: "Profile this group",
      gex: "Try a sample group",
      gsum: "{n} messages from {s} people. {r} contain warning signs.",
      gworst: "Riskiest messages",
      gcount: "Seen in {n} messages",
      paidT: "Already sent money? Act in the next hour.",
      paidP: "The first hours matter most. Do these in order. This is not your fault; these scams fool smart people.",
      foot: "Educational investor-protection tool. It is not investment advice and does not recommend any security or intermediary."
    },
    steps: {
      hi: ['Do not pay any money, fee or "tax". Do not install the app or any screen-sharing tool.', "Never share an OTP, PIN, password or your screen with anyone.", 'Leave the group and block the sender. Ignore "support" agents who contact you afterwards.', "Check the adviser on sebi.gov.in, and check any UPI ID or bank account on SEBI Check (siportal.sebi.gov.in or the SEBI Saarthi app).", "Report it: call 1930 or file at cybercrime.gov.in.", 'If you already sent money, open the "I already paid" tab right now.'],
      mid: ["Pause. Wait 24 hours before doing anything and ask a family member.", "Contact the company only through a website you type yourself, never through links in the message.", "Verify registration on sebi.gov.in and the payment details on SEBI Check.", "If it asks for money, an OTP or an app install, treat it as high risk."],
      lo: ["No known warning patterns matched, but this tool checks only a limited set of signs.", "Never pay anyone who guarantees returns or tells you to hurry.", "Verify registrations on sebi.gov.in and type official websites yourself."]
    },
    paid: ["Call 1930, the national cybercrime helpline, and report the payment right away.", "Call your bank or UPI app and ask them to flag or hold the transaction. Give the time, amount and receiver details.", "File a complaint at cybercrime.gov.in with screenshots, numbers, links and receipts.", 'Stop all further payments. "Tax", "release fee" and "recovery charges" are the second stage of the scam.', "Do not trust anyone offering to recover your money for a fee, even if they claim to be police, SEBI or a lawyer.", "Remove any app they made you install, change your banking passwords, and tell a family member today."],
    rules: {
      guarantee: ['Guaranteed or "sure" returns', "No genuine investment can guarantee returns, and SEBI-registered advisers may not promise profits."],
      unreal: ["Unrealistic profit claims", "Returns like 20 to 50 percent a month are not realistic. Big numbers are bait to switch off your caution."],
      rush: ["Pressure to hurry", "Fake deadlines stop you from thinking or asking family. Real investments do not vanish in minutes."],
      app: ["Asks you to install an app or remote-access tool", "Unknown apps and screen-sharing tools let criminals see your OTPs and bank apps. Use only your registered broker's official app."],
      fee: ["Asks for a fee, tax or deposit", 'Genuine platforms show charges openly. "Pay a fee to unlock your money" is a classic second-stage scam.'],
      upi: ["Payment to a personal UPI ID", "Registered brokers and mutual funds collect money only through SEBI-verified UPI IDs ending in @valid (like name.brk@validbank). Check any UPI ID on SEBI Check before paying."],
      otp: ["Asks for OTP, PIN or password", "No genuine bank, broker or regulator will ever ask for your OTP or PIN."],
      group: ['Private "tips" group or channel', "Pump-and-dump groups hype a stock to draw you in, so organisers can sell to you at a profit."],
      tip: ['Operator-style "tip" language', 'Tip calls and "insider" claims are hallmarks of market manipulation. Honest education explains risk, not targets.'],
      approval: ["Claims official approval", "SEBI does not approve or endorse individual tipsters or schemes. Borrowing a regulator's name is a trust trick."],
      secret: ["Demands secrecy", "Scammers isolate you so nobody can warn you. Talking to family is your best defence."],
      blocked: ['"Blocked money" or recovery offer', 'A "blocked withdrawal" is where victims are asked for more money. Upfront-fee recovery agents are scammers too.'],
      proof: ['Profit "proof" and testimonials', '"I made Rs 18,000" messages and profit screenshots are cheap to fake. They create herd behaviour and fear of missing out.'],
      lookalike: ["Look-alike website address", '"{h}" imitates {b} but is not its official site ({d}). Cloned portals steal logins and deposits.'],
      tld: ["Unusual website ending", "Cheap endings like .xyz, .top or .vip are often used for throwaway scam sites."],
      short: ["Shortened link hides the destination", "You cannot see where this link goes. Do not open it. Ask for the full address."],
      regbad: ["SEBI-style number looks invalid", '"{r}" does not fit the 9-digit pattern of real SEBI registration numbers (3 letters + 9 digits). Fake numbers are common in scams.'],
      regnone: ["Claims registration but gives no checkable number", "A real adviser can give a registration number you can verify on SEBI's website. Vague claims cannot be verified."],
      tipheavy: ["Group is full of tip-style posts", "{n} of {t} messages push guaranteed returns or tip-style calls. Real learning groups explain risk; tip factories sell hope."],
      onevoice: ["One person drives the calls", '{who} wrote {n} of the tip-style messages. One "admin" steering everyone is how pump-and-dump groups run.']
    },
    notes: {
      regok: `{r} has a valid format, but format proves nothing because scammers copy real numbers. Search the name and number on SEBI's "Intermediaries" page at sebi.gov.in.`,
      siteok: "{h} matches a known official website. Still, type addresses yourself instead of tapping links.",
      validok: "{h} follows SEBI's verified-handle format. Still confirm it on SEBI Check (siportal.sebi.gov.in) before paying; your UPI app should also show SEBI's verified icon."
    }
  };

  // src/locales/hi.js
  var hi_default = {
    ui: {
      tag: '\u0915\u094B\u0908 \u0938\u0902\u0926\u093F\u0917\u094D\u0927 \u092E\u0948\u0938\u0947\u091C, \u0932\u093F\u0902\u0915 \u092F\u093E "\u091F\u093F\u092A" \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902, \u092F\u093E \u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u0905\u092A\u0932\u094B\u0921 \u0915\u0930\u0947\u0902\u0964 \u092A\u0948\u0938\u0947 \u092D\u0947\u091C\u0928\u0947 \u092F\u093E \u0910\u092A \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0906\u0938\u093E\u0928 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u091C\u093E\u0901\u091A \u092A\u093E\u090F\u0901\u0964',
      priv: "\u0906\u092A\u0915\u0940 \u0928\u093F\u091C\u0924\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u0948\u0964 \u091C\u093E\u0901\u091A \u0906\u092A\u0915\u0947 \u092B\u093C\u094B\u0928 \u092A\u0930 \u0939\u0940 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964 \u0906\u092A\u0915\u093E \u092E\u0948\u0938\u0947\u091C \u0915\u0939\u0940\u0902 \u0905\u092A\u0932\u094B\u0921 \u092F\u093E \u0938\u0947\u0935 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964",
      t_chk: "\u092E\u0948\u0938\u0947\u091C \u091C\u093E\u0901\u091A\u0947\u0902",
      t_grp: "\u0917\u094D\u0930\u0941\u092A \u091A\u0948\u091F \u091C\u093E\u0901\u091A\u0947\u0902",
      t_paid: "\u092A\u0948\u0938\u0947 \u092D\u0947\u091C \u091A\u0941\u0915\u093E \u0939\u0942\u0901",
      lab: "\u091C\u093E\u0901\u091A\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092E\u0948\u0938\u0947\u091C, \u091F\u093F\u092A \u092F\u093E \u0932\u093F\u0902\u0915",
      ph: "WhatsApp, Telegram, SMS \u092F\u093E \u0908\u092E\u0947\u0932 \u0915\u093E \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u092F\u0939\u093E\u0901 \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902...",
      go: "\u0905\u092D\u0940 \u091C\u093E\u0901\u091A\u0947\u0902",
      clr: "\u0938\u093E\u092B\u093C \u0915\u0930\u0947\u0902",
      shot: "\u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u0905\u092A\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
      try: "\u0909\u0926\u093E\u0939\u0930\u0923 \u0906\u091C\u093C\u092E\u093E\u090F\u0901:",
      a: '"VIP \u091F\u093F\u092A\u094D\u0938" \u0917\u094D\u0930\u0941\u092A',
      b: "\u0930\u0941\u0915\u093E \u0939\u0941\u0906 \u092A\u0948\u0938\u093E",
      c: "\u0905\u0938\u0932\u0940 SIP \u0930\u093F\u092E\u093E\u0907\u0902\u0921\u0930",
      d: "\u0939\u093F\u0902\u0926\u0940 \u0938\u094D\u0915\u0948\u092E \u092E\u0948\u0938\u0947\u091C",
      empty: "\u0915\u0943\u092A\u092F\u093E \u092A\u0939\u0932\u0947 \u092A\u0942\u0930\u093E \u092E\u0948\u0938\u0947\u091C \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902\u0964 \u092C\u0939\u0941\u0924 \u091B\u094B\u091F\u093E \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u091C\u093E\u0901\u091A\u0928\u093E \u092E\u0941\u0936\u094D\u0915\u093F\u0932 \u0939\u0948\u0964",
      ocr: "\u0906\u092A\u0915\u0947 \u092B\u093C\u094B\u0928 \u092A\u0930 \u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u092A\u0922\u093C\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948...",
      ocrfail: "\u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u092A\u0922\u093C\u093E \u0928\u0939\u0940\u0902 \u091C\u093E \u0938\u0915\u093E (\u0907\u0938\u0915\u0947 \u0932\u093F\u090F \u090F\u0915 \u092C\u093E\u0930 \u0907\u0902\u091F\u0930\u0928\u0947\u091F \u091A\u093E\u0939\u093F\u090F)\u0964 \u0915\u0943\u092A\u092F\u093E \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902\u0964",
      v_hi: "\u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0916\u093C\u0924\u0930\u093E",
      v_hiS: "\u0915\u094B\u0908 \u092A\u0948\u0938\u093E \u0928 \u092D\u0947\u091C\u0947\u0902, \u0915\u0941\u091B \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0928 \u0915\u0930\u0947\u0902, \u0915\u0941\u091B \u0936\u0947\u092F\u0930 \u0928 \u0915\u0930\u0947\u0902\u0964",
      v_mid: "\u0938\u093E\u0935\u0927\u093E\u0928 \u0930\u0939\u0947\u0902",
      v_midS: "\u0915\u0941\u091B \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0915\u0947 \u0938\u0902\u0915\u0947\u0924 \u092E\u093F\u0932\u0947\u0964 \u0915\u0926\u092E \u0909\u0920\u093E\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u091C\u093E\u0901\u091A \u0932\u0947\u0902\u0964",
      v_lo: "\u0915\u094B\u0908 \u092C\u0921\u093C\u093E \u0916\u093C\u0924\u0930\u0947 \u0915\u093E \u0938\u0902\u0915\u0947\u0924 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E",
      v_loS: "\u0907\u0938\u0915\u093E \u092E\u0924\u0932\u092C \u092F\u0939 \u0928\u0939\u0940\u0902 \u0915\u093F \u092F\u0939 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u0948\u0964",
      score: "\u091C\u094B\u0916\u093F\u092E \u0938\u0902\u0915\u0947\u0924: 100 \u092E\u0947\u0902 \u0938\u0947 {s}\u0964 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0915\u0947 \u0938\u0902\u0915\u0947\u0924: {n}\u0964",
      read: "\u0938\u0941\u0928\u0947\u0902",
      copy: "\u0938\u093E\u0930\u093E\u0902\u0936 \u0915\u0949\u092A\u0940 \u0915\u0930\u0947\u0902",
      copied: "\u0915\u0949\u092A\u0940 \u0939\u094B \u0917\u092F\u093E",
      nocopy: "\u0915\u0949\u092A\u0940 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902",
      looked: "\u0939\u092E\u0928\u0947 \u0915\u094D\u092F\u093E \u091C\u093E\u0901\u091A\u093E",
      hl: "\u0939\u093E\u0907\u0932\u093E\u0907\u091F \u092C\u0924\u093E\u0924\u0947 \u0939\u0948\u0902 \u0915\u093F \u0939\u0930 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092E\u0948\u0938\u0947\u091C \u092E\u0947\u0902 \u0915\u0939\u093E\u0901 \u092E\u093F\u0932\u0940\u0964",
      signs: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0915\u0947 \u0938\u0902\u0915\u0947\u0924",
      found: "\u092E\u093F\u0932\u093E:",
      ser: "\u0917\u0902\u092D\u0940\u0930",
      warn: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940",
      noted: "\u092F\u0939 \u092D\u0940 \u0926\u0947\u0916\u093E",
      todo: "\u0905\u092C \u0915\u094D\u092F\u093E \u0915\u0930\u0947\u0902",
      sure: "\u0939\u092E \u0915\u093F\u0924\u0928\u0947 \u092A\u0915\u094D\u0915\u0947 \u0939\u0948\u0902?",
      sureT: "\u092F\u0939 \u091C\u093E\u0901\u091A \u0924\u092F \u0914\u0930 \u0926\u093F\u0916\u0928\u0947 \u0935\u093E\u0932\u0947 \u0928\u093F\u092F\u092E\u094B\u0902 \u092A\u0930 \u091A\u0932\u0924\u0940 \u0939\u0948, \u0905\u0902\u0926\u093E\u091C\u093C\u0947 \u092A\u0930 \u0928\u0939\u0940\u0902\u0964 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0938\u094D\u0915\u094B\u0930 \u0915\u093E \u092E\u0924\u0932\u092C \u0920\u0917\u0940 \u0938\u093E\u092C\u093F\u0924 \u0939\u094B\u0928\u093E \u0928\u0939\u0940\u0902 \u0939\u0948, \u0914\u0930 \u0915\u092E \u0938\u094D\u0915\u094B\u0930 \u0915\u093E \u092E\u0924\u0932\u092C \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u094B\u0928\u093E \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u092F\u0939 \u0928\u093F\u0935\u0947\u0936 \u0915\u0940 \u0938\u0932\u093E\u0939 \u0928\u0939\u0940\u0902 \u0926\u0947\u0924\u0940\u0964",
      glab: '\u0917\u094D\u0930\u0941\u092A \u091A\u0948\u091F \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902 (WhatsApp "Export chat" \u0915\u093E \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0938\u092C\u0938\u0947 \u0905\u091A\u094D\u091B\u093E \u0930\u0939\u0924\u093E \u0939\u0948)',
      gph: "\u091A\u0948\u091F \u092F\u0939\u093E\u0901 \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902...",
      ggo: "\u0907\u0938 \u0917\u094D\u0930\u0941\u092A \u0915\u094B \u091C\u093E\u0901\u091A\u0947\u0902",
      gex: "\u0928\u092E\u0942\u0928\u093E \u0917\u094D\u0930\u0941\u092A \u0906\u091C\u093C\u092E\u093E\u090F\u0901",
      gsum: "{s} \u0932\u094B\u0917\u094B\u0902 \u0915\u0947 {n} \u092E\u0948\u0938\u0947\u091C\u0964 \u0907\u0928\u092E\u0947\u0902 \u0938\u0947 {r} \u092E\u0947\u0902 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0915\u0947 \u0938\u0902\u0915\u0947\u0924 \u0939\u0948\u0902\u0964",
      gworst: "\u0938\u092C\u0938\u0947 \u091C\u094B\u0916\u093F\u092E \u092D\u0930\u0947 \u092E\u0948\u0938\u0947\u091C",
      gcount: "{n} \u092E\u0948\u0938\u0947\u091C \u092E\u0947\u0902 \u0926\u093F\u0916\u093E",
      paidT: "\u092A\u0948\u0938\u0947 \u092D\u0947\u091C \u0926\u093F\u090F? \u0905\u0917\u0932\u0947 \u090F\u0915 \u0918\u0902\u091F\u0947 \u092E\u0947\u0902 \u0915\u0926\u092E \u0909\u0920\u093E\u090F\u0901\u0964",
      paidP: "\u0936\u0941\u0930\u0941\u0906\u0924\u0940 \u0918\u0902\u091F\u0947 \u0938\u092C\u0938\u0947 \u0905\u0939\u092E \u0939\u0948\u0902\u0964 \u0907\u0928\u094D\u0939\u0947\u0902 \u0915\u094D\u0930\u092E \u0938\u0947 \u0915\u0930\u0947\u0902\u0964 \u092F\u0939 \u0906\u092A\u0915\u0940 \u0917\u0932\u0924\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948; \u0910\u0938\u0940 \u0920\u0917\u0940 \u0938\u092E\u091D\u0926\u093E\u0930 \u0932\u094B\u0917\u094B\u0902 \u0915\u094B \u092D\u0940 \u092B\u0901\u0938\u093E \u0932\u0947\u0924\u0940 \u0939\u0948\u0964",
      foot: "\u0928\u093F\u0935\u0947\u0936\u0915 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u0947 \u0932\u093F\u090F \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u091F\u0942\u0932\u0964 \u092F\u0939 \u0928\u093F\u0935\u0947\u0936 \u0915\u0940 \u0938\u0932\u093E\u0939 \u0928\u0939\u0940\u0902 \u0939\u0948 \u0914\u0930 \u0915\u093F\u0938\u0940 \u0936\u0947\u092F\u0930 \u092F\u093E \u092E\u0927\u094D\u092F\u0938\u094D\u0925 \u0915\u0940 \u0938\u093F\u092B\u093C\u093E\u0930\u093F\u0936 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093E\u0964"
    },
    steps: {
      hi: ['\u0915\u094B\u0908 \u092A\u0948\u0938\u093E, \u092B\u0940\u0938 \u092F\u093E "\u091F\u0948\u0915\u094D\u0938" \u0928 \u092D\u0947\u091C\u0947\u0902\u0964 \u0915\u094B\u0908 \u0910\u092A \u092F\u093E \u0938\u094D\u0915\u094D\u0930\u0940\u0928-\u0936\u0947\u092F\u0930\u093F\u0902\u0917 \u091F\u0942\u0932 \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0928 \u0915\u0930\u0947\u0902\u0964', "OTP, PIN, \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092F\u093E \u0905\u092A\u0928\u0940 \u0938\u094D\u0915\u094D\u0930\u0940\u0928 \u0915\u093F\u0938\u0940 \u0938\u0947 \u0936\u0947\u092F\u0930 \u0928 \u0915\u0930\u0947\u0902\u0964", '\u0917\u094D\u0930\u0941\u092A \u091B\u094B\u0921\u093C\u0947\u0902 \u0914\u0930 \u092D\u0947\u091C\u0928\u0947 \u0935\u093E\u0932\u0947 \u0915\u094B \u092C\u094D\u0932\u0949\u0915 \u0915\u0930\u0947\u0902\u0964 \u092C\u093E\u0926 \u092E\u0947\u0902 \u0906\u0928\u0947 \u0935\u093E\u0932\u0947 "\u0938\u092A\u094B\u0930\u094D\u091F" \u0915\u0949\u0932 \u092A\u0930 \u092D\u0930\u094B\u0938\u093E \u0928 \u0915\u0930\u0947\u0902\u0964', "sebi.gov.in \u092A\u0930 \u0938\u0932\u093E\u0939\u0915\u093E\u0930 \u0915\u094B \u091C\u093E\u0901\u091A\u0947\u0902, \u0914\u0930 \u0915\u093F\u0938\u0940 \u092D\u0940 UPI ID \u092F\u093E \u092C\u0948\u0902\u0915 \u0916\u093E\u0924\u0947 \u0915\u094B SEBI Check (siportal.sebi.gov.in \u092F\u093E SEBI Saarthi \u0910\u092A) \u092A\u0930 \u091C\u093E\u0901\u091A\u0947\u0902\u0964", "\u0936\u093F\u0915\u093E\u092F\u0924 \u0915\u0930\u0947\u0902: 1930 \u092A\u0930 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902 \u092F\u093E cybercrime.gov.in \u092A\u0930 \u0930\u093F\u092A\u094B\u0930\u094D\u091F \u0915\u0930\u0947\u0902\u0964", '\u0905\u0917\u0930 \u092A\u0948\u0938\u0947 \u092D\u0947\u091C \u091A\u0941\u0915\u0947 \u0939\u0948\u0902 \u0924\u094B \u0905\u092D\u0940 "\u092A\u0948\u0938\u0947 \u092D\u0947\u091C \u091A\u0941\u0915\u093E \u0939\u0942\u0901" \u091F\u0948\u092C \u0916\u094B\u0932\u0947\u0902\u0964'],
      mid: ["\u0930\u0941\u0915\u093F\u090F\u0964 \u0915\u0941\u091B \u0915\u0930\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 24 \u0918\u0902\u091F\u0947 \u0930\u0941\u0915\u0947\u0902 \u0914\u0930 \u0918\u0930 \u0915\u0947 \u0915\u093F\u0938\u0940 \u0938\u0926\u0938\u094D\u092F \u0938\u0947 \u092A\u0942\u091B\u0947\u0902\u0964", "\u0915\u0902\u092A\u0928\u0940 \u0938\u0947 \u0938\u093F\u0930\u094D\u092B\u093C \u0909\u0938 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0938\u0947 \u0938\u0902\u092A\u0930\u094D\u0915 \u0915\u0930\u0947\u0902 \u091C\u094B \u0906\u092A \u0916\u093C\u0941\u0926 \u091F\u093E\u0907\u092A \u0915\u0930\u0947\u0902, \u092E\u0948\u0938\u0947\u091C \u0915\u0947 \u0932\u093F\u0902\u0915 \u0938\u0947 \u0928\u0939\u0940\u0902\u0964", "sebi.gov.in \u092A\u0930 \u0930\u091C\u093F\u0938\u094D\u091F\u094D\u0930\u0947\u0936\u0928 \u0914\u0930 SEBI Check \u092A\u0930 \u092D\u0941\u0917\u0924\u093E\u0928 \u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u091C\u093E\u0901\u091A\u0947\u0902\u0964", "\u0905\u0917\u0930 \u092A\u0948\u0938\u0947, OTP \u092F\u093E \u0910\u092A \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u092E\u093E\u0901\u0917\u093E \u091C\u093E\u090F, \u0924\u094B \u0909\u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0916\u093C\u0924\u0930\u0947 \u0935\u093E\u0932\u093E \u092E\u093E\u0928\u0947\u0902\u0964"],
      lo: ["\u0915\u094B\u0908 \u091C\u093E\u0928\u093E-\u092A\u0939\u091A\u093E\u0928\u093E \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092A\u0948\u091F\u0930\u094D\u0928 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E, \u0932\u0947\u0915\u093F\u0928 \u092F\u0939 \u091F\u0942\u0932 \u0938\u0940\u092E\u093F\u0924 \u0938\u0902\u0915\u0947\u0924 \u0939\u0940 \u091C\u093E\u0901\u091A\u0924\u093E \u0939\u0948\u0964", "\u091C\u094B \u092D\u0940 \u0930\u093F\u091F\u0930\u094D\u0928 \u0915\u0940 \u0917\u093E\u0930\u0902\u091F\u0940 \u0926\u0947 \u092F\u093E \u091C\u0932\u094D\u0926\u0940 \u0915\u0930\u0928\u0947 \u0915\u094B \u0915\u0939\u0947, \u0909\u0938\u0947 \u092A\u0948\u0938\u0947 \u0928 \u0926\u0947\u0902\u0964", "sebi.gov.in \u092A\u0930 \u0930\u091C\u093F\u0938\u094D\u091F\u094D\u0930\u0947\u0936\u0928 \u091C\u093E\u0901\u091A\u0947\u0902 \u0914\u0930 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0916\u093C\u0941\u0926 \u091F\u093E\u0907\u092A \u0915\u0930\u0947\u0902\u0964"]
    },
    paid: ["1930 \u092A\u0930 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902 (\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0938\u093E\u0907\u092C\u0930 \u0915\u094D\u0930\u093E\u0907\u092E \u0939\u0947\u0932\u094D\u092A\u0932\u093E\u0907\u0928) \u0914\u0930 \u092D\u0941\u0917\u0924\u093E\u0928 \u0915\u0940 \u0924\u0941\u0930\u0902\u0924 \u0930\u093F\u092A\u094B\u0930\u094D\u091F \u0915\u0930\u0947\u0902\u0964", "\u0905\u092A\u0928\u0947 \u092C\u0948\u0902\u0915 \u092F\u093E UPI \u0910\u092A \u0915\u094B \u0915\u0949\u0932 \u0915\u0930\u0915\u0947 \u0932\u0947\u0928-\u0926\u0947\u0928 \u0930\u094B\u0915\u0928\u0947 \u0915\u094B \u0915\u0939\u0947\u0902\u0964 \u0938\u092E\u092F, \u0930\u0915\u092E \u0914\u0930 \u092A\u093E\u0928\u0947 \u0935\u093E\u0932\u0947 \u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0926\u0947\u0902\u0964", "cybercrime.gov.in \u092A\u0930 \u0936\u093F\u0915\u093E\u092F\u0924 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902, \u0938\u093E\u0925 \u092E\u0947\u0902 \u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F, \u0928\u0902\u092C\u0930, \u0932\u093F\u0902\u0915 \u0914\u0930 \u0930\u0938\u0940\u0926\u0947\u0902 \u0930\u0916\u0947\u0902\u0964", '\u0906\u0917\u0947 \u0915\u094B\u0908 \u092D\u0941\u0917\u0924\u093E\u0928 \u0928 \u0915\u0930\u0947\u0902\u0964 "\u091F\u0948\u0915\u094D\u0938", "\u0930\u093F\u0932\u0940\u091C\u093C \u092B\u0940\u0938" \u0914\u0930 "\u0930\u093F\u0915\u0935\u0930\u0940 \u091A\u093E\u0930\u094D\u091C" \u0920\u0917\u0940 \u0915\u093E \u0926\u0942\u0938\u0930\u093E \u091A\u0930\u0923 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964', "\u091C\u094B \u092B\u0940\u0938 \u0932\u0947\u0915\u0930 \u0906\u092A\u0915\u093E \u092A\u0948\u0938\u093E \u0935\u093E\u092A\u0938 \u0926\u093F\u0932\u093E\u0928\u0947 \u0915\u093E \u0926\u093E\u0935\u093E \u0915\u0930\u0947, \u0909\u0938 \u092A\u0930 \u092D\u0930\u094B\u0938\u093E \u0928 \u0915\u0930\u0947\u0902, \u091A\u093E\u0939\u0947 \u0935\u0939 \u092A\u0941\u0932\u093F\u0938, SEBI \u092F\u093E \u0935\u0915\u0940\u0932 \u092C\u0928\u0915\u0930 \u0906\u090F\u0964", "\u091C\u094B \u0910\u092A \u0909\u0928\u094D\u0939\u094B\u0902\u0928\u0947 \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u093E\u092F\u093E \u0909\u0938\u0947 \u0939\u091F\u093E\u090F\u0901, \u092C\u0948\u0902\u0915\u093F\u0902\u0917 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092C\u0926\u0932\u0947\u0902 \u0914\u0930 \u0906\u091C \u0939\u0940 \u092A\u0930\u093F\u0935\u093E\u0930 \u0915\u0947 \u0915\u093F\u0938\u0940 \u0938\u0926\u0938\u094D\u092F \u0915\u094B \u092C\u0924\u093E\u090F\u0901\u0964"],
    rules: {
      guarantee: ['\u0917\u093E\u0930\u0902\u091F\u0940 \u092F\u093E "\u092A\u0915\u094D\u0915\u0947" \u0930\u093F\u091F\u0930\u094D\u0928', "\u0915\u094B\u0908 \u092D\u0940 \u0905\u0938\u0932\u0940 \u0928\u093F\u0935\u0947\u0936 \u0930\u093F\u091F\u0930\u094D\u0928 \u0915\u0940 \u0917\u093E\u0930\u0902\u091F\u0940 \u0928\u0939\u0940\u0902 \u0926\u0947 \u0938\u0915\u0924\u093E, \u0914\u0930 SEBI-\u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u0938\u0932\u093E\u0939\u0915\u093E\u0930 \u092E\u0941\u0928\u093E\u092B\u093C\u0947 \u0915\u093E \u0935\u093E\u0926\u093E \u0928\u0939\u0940\u0902 \u0915\u0930 \u0938\u0915\u0924\u0947\u0964"],
      unreal: ["\u0905\u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u092E\u0941\u0928\u093E\u092B\u093C\u0947 \u0915\u0947 \u0926\u093E\u0935\u0947", "\u0939\u0930 \u092E\u0939\u0940\u0928\u0947 20-50 \u092A\u094D\u0930\u0924\u093F\u0936\u0924 \u091C\u0948\u0938\u093E \u0930\u093F\u091F\u0930\u094D\u0928 \u0939\u0915\u093C\u0940\u0915\u093C\u0924 \u092E\u0947\u0902 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964 \u092C\u0921\u093C\u0947 \u0906\u0901\u0915\u0921\u093C\u0947 \u0906\u092A\u0915\u0940 \u0938\u093E\u0935\u0927\u093E\u0928\u0940 \u0939\u091F\u093E\u0928\u0947 \u0915\u093E \u091A\u093E\u0930\u093E \u0939\u0948\u0902\u0964"],
      rush: ["\u091C\u0932\u094D\u0926\u0940 \u0915\u0930\u0928\u0947 \u0915\u093E \u0926\u092C\u093E\u0935", "\u0928\u0915\u0932\u0940 \u0921\u0947\u0921\u0932\u093E\u0907\u0928 \u0906\u092A\u0915\u094B \u0938\u094B\u091A\u0928\u0947 \u092F\u093E \u0918\u0930 \u0935\u093E\u0932\u094B\u0902 \u0938\u0947 \u092A\u0942\u091B\u0928\u0947 \u0928\u0939\u0940\u0902 \u0926\u0947\u0924\u0940\u0964 \u0905\u0938\u0932\u0940 \u0928\u093F\u0935\u0947\u0936 \u092E\u093F\u0928\u091F\u094B\u0902 \u092E\u0947\u0902 \u0917\u093C\u093E\u092F\u092C \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964"],
      app: ["\u0910\u092A \u092F\u093E \u0930\u093F\u092E\u094B\u091F-\u090F\u0915\u094D\u0938\u0947\u0938 \u091F\u0942\u0932 \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0928\u0947 \u0915\u094B \u0915\u0939\u0924\u093E \u0939\u0948", "\u0905\u0928\u091C\u093E\u0928 \u0910\u092A \u0914\u0930 \u0938\u094D\u0915\u094D\u0930\u0940\u0928-\u0936\u0947\u092F\u0930\u093F\u0902\u0917 \u091F\u0942\u0932 \u0938\u0947 \u0920\u0917 \u0906\u092A\u0915\u0947 OTP \u0914\u0930 \u092C\u0948\u0902\u0915 \u0910\u092A \u0926\u0947\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964 \u0938\u093F\u0930\u094D\u092B\u093C \u0905\u092A\u0928\u0947 \u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u092C\u094D\u0930\u094B\u0915\u0930 \u0915\u093E \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0910\u092A \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u0930\u0947\u0902\u0964"],
      fee: ["\u092B\u0940\u0938, \u091F\u0948\u0915\u094D\u0938 \u092F\u093E \u0921\u093F\u092A\u0949\u091C\u093C\u093F\u091F \u092E\u093E\u0901\u0917\u0924\u093E \u0939\u0948", '\u0905\u0938\u0932\u0940 \u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E \u0936\u0941\u0932\u094D\u0915 \u0916\u0941\u0932\u0915\u0930 \u0926\u093F\u0916\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 "\u092A\u0948\u0938\u093E \u0928\u093F\u0915\u093E\u0932\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092B\u0940\u0938 \u092D\u0930\u0947\u0902" \u0920\u0917\u0940 \u0915\u093E \u091C\u093E\u0928\u093E-\u092A\u0939\u091A\u093E\u0928\u093E \u0926\u0942\u0938\u0930\u093E \u091A\u0930\u0923 \u0939\u0948\u0964'],
      upi: ["\u0915\u093F\u0938\u0940 \u0935\u094D\u092F\u0915\u094D\u0924\u093F \u0915\u0947 UPI ID \u092E\u0947\u0902 \u092D\u0941\u0917\u0924\u093E\u0928", "\u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u092C\u094D\u0930\u094B\u0915\u0930 \u0914\u0930 \u092E\u094D\u092F\u0942\u091A\u0941\u0905\u0932 \u092B\u0902\u0921 \u0938\u093F\u0930\u094D\u092B\u093C SEBI-\u0938\u0924\u094D\u092F\u093E\u092A\u093F\u0924 UPI ID (@valid \u092A\u0930 \u0916\u093C\u0924\u094D\u092E, \u091C\u0948\u0938\u0947 name.brk@validbank) \u092E\u0947\u0902 \u092A\u0948\u0938\u093E \u0932\u0947\u0924\u0947 \u0939\u0948\u0902\u0964 \u092D\u0941\u0917\u0924\u093E\u0928 \u0938\u0947 \u092A\u0939\u0932\u0947 UPI ID \u0915\u094B SEBI Check \u092A\u0930 \u091C\u093E\u0901\u091A\u0947\u0902\u0964"],
      otp: ["OTP, PIN \u092F\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092E\u093E\u0901\u0917\u0924\u093E \u0939\u0948", "\u0915\u094B\u0908 \u0905\u0938\u0932\u0940 \u092C\u0948\u0902\u0915, \u092C\u094D\u0930\u094B\u0915\u0930 \u092F\u093E \u0928\u093F\u092F\u093E\u092E\u0915 \u0906\u092A\u0938\u0947 OTP \u092F\u093E PIN \u0915\u092D\u0940 \u0928\u0939\u0940\u0902 \u092E\u093E\u0901\u0917\u0947\u0917\u093E\u0964"],
      group: ['\u0928\u093F\u091C\u0940 "\u091F\u093F\u092A\u094D\u0938" \u0917\u094D\u0930\u0941\u092A \u092F\u093E \u091A\u0948\u0928\u0932', "\u092A\u0902\u092A-\u090F\u0902\u0921-\u0921\u0902\u092A \u0917\u094D\u0930\u0941\u092A \u0915\u093F\u0938\u0940 \u0936\u0947\u092F\u0930 \u0915\u093E \u0939\u0932\u094D\u0932\u093E \u092E\u091A\u093E\u0915\u0930 \u0906\u092A\u0915\u094B \u092B\u0901\u0938\u093E\u0924\u0947 \u0939\u0948\u0902 \u0924\u093E\u0915\u093F \u0906\u092F\u094B\u091C\u0915 \u0906\u092A\u0915\u094B \u092C\u0947\u091A\u0915\u0930 \u092E\u0941\u0928\u093E\u092B\u093C\u093E \u0915\u092E\u093E \u0938\u0915\u0947\u0902\u0964"],
      tip: ['\u0911\u092A\u0930\u0947\u091F\u0930-\u0936\u0948\u0932\u0940 \u0915\u0940 "\u091F\u093F\u092A" \u092D\u093E\u0937\u093E', '\u091F\u093F\u092A \u0915\u0949\u0932 \u0914\u0930 "\u0907\u0928\u0938\u093E\u0907\u0921\u0930" \u0926\u093E\u0935\u0947 \u092C\u093E\u091C\u093C\u093E\u0930 \u092E\u0947\u0902 \u0939\u0947\u0930\u092B\u0947\u0930 \u0915\u0947 \u0932\u0915\u094D\u0937\u0923 \u0939\u0948\u0902\u0964 \u0908\u092E\u093E\u0928\u0926\u093E\u0930 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u091C\u094B\u0916\u093F\u092E \u0938\u092E\u091D\u093E\u0924\u0940 \u0939\u0948, \u091F\u093E\u0930\u0917\u0947\u091F \u0928\u0939\u0940\u0902\u0964'],
      approval: ["\u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u092E\u0902\u091C\u093C\u0942\u0930\u0940 \u0915\u093E \u0926\u093E\u0935\u093E", "SEBI \u0915\u093F\u0938\u0940 \u091F\u093F\u092A \u0926\u0947\u0928\u0947 \u0935\u093E\u0932\u0947 \u092F\u093E \u0938\u094D\u0915\u0940\u092E \u0915\u094B \u092E\u0902\u091C\u093C\u0942\u0930\u0940 \u092F\u093E \u0938\u092E\u0930\u094D\u0925\u0928 \u0928\u0939\u0940\u0902 \u0926\u0947\u0924\u093E\u0964 \u0928\u093F\u092F\u093E\u092E\u0915 \u0915\u093E \u0928\u093E\u092E \u0932\u0947\u0928\u093E \u092D\u0930\u094B\u0938\u093E \u091C\u0940\u0924\u0928\u0947 \u0915\u0940 \u091A\u093E\u0932 \u0939\u0948\u0964"],
      secret: ["\u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E \u0915\u0940 \u092E\u093E\u0901\u0917", "\u0920\u0917 \u0906\u092A\u0915\u094B \u0905\u0915\u0947\u0932\u093E \u0915\u0930 \u0926\u0947\u0924\u0947 \u0939\u0948\u0902 \u0924\u093E\u0915\u093F \u0915\u094B\u0908 \u0906\u092A\u0915\u094B \u091A\u0947\u0924\u093E \u0928 \u0938\u0915\u0947\u0964 \u092A\u0930\u093F\u0935\u093E\u0930 \u0938\u0947 \u092C\u093E\u0924 \u0915\u0930\u0928\u093E \u0938\u092C\u0938\u0947 \u0905\u091A\u094D\u091B\u093E \u092C\u091A\u093E\u0935 \u0939\u0948\u0964"],
      blocked: ['"\u0930\u0941\u0915\u093E \u0939\u0941\u0906 \u092A\u0948\u0938\u093E" \u092F\u093E \u0930\u093F\u0915\u0935\u0930\u0940 \u0915\u093E \u0911\u092B\u093C\u0930', '"\u0928\u093F\u0915\u093E\u0938\u0940 \u0930\u0941\u0915\u0940 \u0939\u0948" \u0915\u0939\u0915\u0930 \u092A\u0940\u0921\u093C\u093F\u0924\u094B\u0902 \u0938\u0947 \u0914\u0930 \u092A\u0948\u0938\u0947 \u092E\u093E\u0901\u0917\u0947 \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 \u092A\u0939\u0932\u0947 \u092B\u0940\u0938 \u0932\u0947\u0928\u0947 \u0935\u093E\u0932\u0947 \u0930\u093F\u0915\u0935\u0930\u0940 \u090F\u091C\u0947\u0902\u091F \u092D\u0940 \u0920\u0917 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964'],
      proof: ['\u092E\u0941\u0928\u093E\u092B\u093C\u0947 \u0915\u093E "\u0938\u092C\u0942\u0924" \u0914\u0930 \u0924\u093E\u0930\u0940\u092B\u093C\u0947\u0902', '"\u092E\u0948\u0902\u0928\u0947 18,000 \u0915\u092E\u093E\u090F" \u091C\u0948\u0938\u0947 \u092E\u0948\u0938\u0947\u091C \u0914\u0930 \u092E\u0941\u0928\u093E\u092B\u093C\u0947 \u0915\u0947 \u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u0928\u0915\u0932\u0940 \u092C\u0928\u093E\u0928\u093E \u0906\u0938\u093E\u0928 \u0939\u0948\u0964 \u092F\u0947 \u092D\u0940\u0921\u093C \u0915\u0940 \u0926\u0947\u0916\u093E\u0926\u0947\u0916\u0940 \u0914\u0930 \u091B\u0942\u091F \u091C\u093E\u0928\u0947 \u0915\u093E \u0921\u0930 \u092A\u0948\u0926\u093E \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964'],
      lookalike: ["\u0928\u0915\u093C\u0932\u0940 \u091C\u0948\u0938\u0940 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0915\u093E \u092A\u0924\u093E", '"{h}" {b} \u0915\u0940 \u0928\u0915\u093C\u0932 \u0915\u0930\u0924\u093E \u0939\u0948 \u0932\u0947\u0915\u093F\u0928 \u0909\u0938\u0915\u0940 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0938\u093E\u0907\u091F ({d}) \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0928\u0915\u093C\u0932\u0940 \u092A\u094B\u0930\u094D\u091F\u0932 \u0932\u0949\u0917\u093F\u0928 \u0914\u0930 \u091C\u092E\u093E \u0930\u0915\u092E \u091A\u0941\u0930\u093E\u0924\u0947 \u0939\u0948\u0902\u0964'],
      tld: ["\u0905\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0905\u0902\u0924", ".xyz, .top \u092F\u093E .vip \u091C\u0948\u0938\u0947 \u0938\u0938\u094D\u0924\u0947 \u0905\u0902\u0924 \u0905\u0915\u094D\u0938\u0930 \u0915\u0941\u091B \u0926\u093F\u0928 \u091A\u0932\u0928\u0947 \u0935\u093E\u0932\u0940 \u0920\u0917 \u0938\u093E\u0907\u091F\u094B\u0902 \u092A\u0930 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964"],
      short: ["\u091B\u094B\u091F\u093E \u0932\u093F\u0902\u0915 \u0905\u0938\u0932\u0940 \u092A\u0924\u093E \u091B\u093F\u092A\u093E\u0924\u093E \u0939\u0948", "\u0906\u092A \u0926\u0947\u0916 \u0928\u0939\u0940\u0902 \u0938\u0915\u0924\u0947 \u0915\u093F \u092F\u0939 \u0932\u093F\u0902\u0915 \u0915\u0939\u093E\u0901 \u091C\u093E\u0924\u093E \u0939\u0948\u0964 \u0907\u0938\u0947 \u0928 \u0916\u094B\u0932\u0947\u0902\u0964 \u092A\u0942\u0930\u093E \u092A\u0924\u093E \u092E\u093E\u0901\u0917\u0947\u0902\u0964"],
      regbad: ["SEBI \u091C\u0948\u0938\u093E \u0928\u0902\u092C\u0930 \u0917\u093C\u0932\u0924 \u0926\u093F\u0916\u0924\u093E \u0939\u0948", '"{r}" \u0905\u0938\u0932\u0940 SEBI \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0928\u0902\u092C\u0930 \u0915\u0947 9-\u0905\u0902\u0915 \u0935\u093E\u0932\u0947 \u092A\u0948\u091F\u0930\u094D\u0928 (3 \u0905\u0915\u094D\u0937\u0930 + 9 \u0905\u0902\u0915) \u0938\u0947 \u092E\u0947\u0932 \u0928\u0939\u0940\u0902 \u0916\u093E\u0924\u093E\u0964 \u0920\u0917\u0940 \u092E\u0947\u0902 \u0928\u0915\u093C\u0932\u0940 \u0928\u0902\u092C\u0930 \u0906\u092E \u0939\u0948\u0902\u0964'],
      regnone: ["\u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0915\u093E \u0926\u093E\u0935\u093E, \u092A\u0930 \u091C\u093E\u0901\u091A\u0928\u0947 \u0932\u093E\u092F\u0915 \u0928\u0902\u092C\u0930 \u0928\u0939\u0940\u0902", "\u0905\u0938\u0932\u0940 \u0938\u0932\u093E\u0939\u0915\u093E\u0930 \u0910\u0938\u093E \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0928\u0902\u092C\u0930 \u0926\u0947\u0924\u093E \u0939\u0948 \u091C\u093F\u0938\u0947 \u0906\u092A SEBI \u0915\u0940 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u092A\u0930 \u091C\u093E\u0901\u091A \u0938\u0915\u0947\u0902\u0964 \u0905\u0938\u094D\u092A\u0937\u094D\u091F \u0926\u093E\u0935\u0947 \u091C\u093E\u0901\u091A\u0947 \u0928\u0939\u0940\u0902 \u091C\u093E \u0938\u0915\u0924\u0947\u0964"],
      tipheavy: ["\u0917\u094D\u0930\u0941\u092A \u092E\u0947\u0902 \u091F\u093F\u092A \u091C\u0948\u0938\u0947 \u092A\u094B\u0938\u094D\u091F \u092D\u0930\u0947 \u0939\u0948\u0902", "{t} \u092E\u0947\u0902 \u0938\u0947 {n} \u092E\u0948\u0938\u0947\u091C \u0917\u093E\u0930\u0902\u091F\u0940\u0936\u0941\u0926\u093E \u0930\u093F\u091F\u0930\u094D\u0928 \u092F\u093E \u091F\u093F\u092A \u091C\u0948\u0938\u0947 \u0915\u0949\u0932 \u0915\u093E \u0926\u092C\u093E\u0935 \u0921\u093E\u0932\u0924\u0947 \u0939\u0948\u0902\u0964 \u0905\u0938\u0932\u0940 \u0938\u0940\u0916\u0928\u0947 \u0935\u093E\u0932\u0947 \u0917\u094D\u0930\u0941\u092A \u091C\u094B\u0916\u093F\u092E \u0938\u092E\u091D\u093E\u0924\u0947 \u0939\u0948\u0902; \u091F\u093F\u092A \u092B\u093C\u0948\u0915\u094D\u091F\u0930\u0940 \u0909\u092E\u094D\u092E\u0940\u0926 \u092C\u0947\u091A\u0924\u0940 \u0939\u0948\u0902\u0964"],
      onevoice: ["\u090F\u0915 \u0939\u0940 \u0935\u094D\u092F\u0915\u094D\u0924\u093F \u0938\u093E\u0930\u0947 \u0915\u0949\u0932 \u091A\u0932\u093E \u0930\u0939\u093E \u0939\u0948", '{who} \u0928\u0947 {n} \u091F\u093F\u092A \u091C\u0948\u0938\u0947 \u092E\u0948\u0938\u0947\u091C \u0932\u093F\u0916\u0947\u0964 \u092A\u0902\u092A-\u090F\u0902\u0921-\u0921\u0902\u092A \u0917\u094D\u0930\u0941\u092A \u0910\u0938\u0947 \u0939\u0940 \u090F\u0915 "\u090F\u0921\u092E\u093F\u0928" \u0915\u0947 \u0907\u0936\u093E\u0930\u0947 \u092A\u0930 \u091A\u0932\u0924\u0947 \u0939\u0948\u0902\u0964']
    },
    notes: {
      regok: '{r} \u0915\u093E \u092B\u093C\u0949\u0930\u094D\u092E\u0947\u091F \u0938\u0939\u0940 \u0939\u0948, \u092A\u0930 \u0938\u093F\u0930\u094D\u092B\u093C \u092B\u093C\u0949\u0930\u094D\u092E\u0947\u091F \u0938\u0947 \u0915\u0941\u091B \u0938\u093E\u092C\u093F\u0924 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E, \u0915\u094D\u092F\u094B\u0902\u0915\u093F \u0920\u0917 \u0905\u0938\u0932\u0940 \u0928\u0902\u092C\u0930 \u092D\u0940 \u0915\u0949\u092A\u0940 \u0915\u0930 \u0932\u0947\u0924\u0947 \u0939\u0948\u0902\u0964 \u0928\u093E\u092E \u0914\u0930 \u0928\u0902\u092C\u0930 sebi.gov.in \u0915\u0947 "Intermediaries" \u092A\u0947\u091C \u092A\u0930 \u0916\u094B\u091C\u0947\u0902\u0964',
      siteok: "{h} \u090F\u0915 \u091C\u093E\u0928\u0940-\u092A\u0939\u091A\u093E\u0928\u0940 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0938\u0947 \u092E\u0947\u0932 \u0916\u093E\u0924\u093E \u0939\u0948\u0964 \u092B\u093F\u0930 \u092D\u0940 \u0932\u093F\u0902\u0915 \u092A\u0930 \u091F\u0948\u092A \u0915\u0930\u0928\u0947 \u0915\u0947 \u092C\u091C\u093E\u092F \u092A\u0924\u093E \u0916\u093C\u0941\u0926 \u091F\u093E\u0907\u092A \u0915\u0930\u0947\u0902\u0964",
      validok: "{h} SEBI \u0915\u0947 \u0938\u0924\u094D\u092F\u093E\u092A\u093F\u0924 \u0939\u0948\u0902\u0921\u0932 \u0915\u0947 \u092B\u093C\u0949\u0930\u094D\u092E\u0947\u091F \u092E\u0947\u0902 \u0939\u0948\u0964 \u092B\u093F\u0930 \u092D\u0940 \u092D\u0941\u0917\u0924\u093E\u0928 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0907\u0938\u0947 SEBI Check (siportal.sebi.gov.in) \u092A\u0930 \u091C\u093E\u0901\u091A\u0947\u0902\u0964"
    }
  };

  // src/ocr.js
  async function ocr(file, lang2, progress) {
    if (!window.Tesseract) await new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      s.onload = ok;
      s.onerror = no;
      document.head.appendChild(s);
    });
    const w = await Tesseract.createWorker(lang2 === "hi" ? "hin+eng" : "eng", 1, { logger: (m) => m.status === "recognizing text" && progress && progress(Math.round(m.progress * 100)) });
    try {
      return (await w.recognize(file)).data.text;
    } finally {
      await w.terminate();
    }
  }

  // src/app.js
  var LG = { en: en_default, hi: hi_default };
  var $ = (s) => document.querySelector(s);
  var $$ = (s) => [...document.querySelectorAll(s)];
  var esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var store = { get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }, set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
    }
  } };
  var saved = store.get("lang");
  var lang = LG[saved] ? saved : (navigator.language || "").startsWith("hi") ? "hi" : "en";
  var last = null;
  var lastG = null;
  var t = (k) => LG[lang].ui[k] ?? en_default.ui[k];
  var fmt = (s, p = {}) => s.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? "");
  var rule = (id, p) => (LG[lang].rules[id] || en_default.rules[id]).map((s) => fmt(s, p));
  var note = (id, p) => fmt(LG[lang].notes[id] || en_default.notes[id], p);
  var steps = (L) => LG[lang].steps[L];
  var ICON = { hi: "\u{1F6D1}", mid: "\u26A0\uFE0F", lo: "\u{1F6E1}\uFE0F" };
  var S = {
    a: `\u{1F525} VIP Stock Tips Group \u{1F525} Join our Telegram channel t.me/profit_kings_vip. Guaranteed 40% returns every month, 100% accuracy! SEBI approved analyst Reg. No. INH00012345. Limited seats, only 5 left. Download our app https://zerodha-pro-trade.xyz/app.apk and pay Rs 5,000 registration fee to 9876543210@ybl. Don't tell anyone.`,
    b: `Dear investor, your withdrawal of Rs 2,40,000 is blocked. Pay 15% tax to release funds. Install AnyDesk so our officer can help recover your money. Visit https://grow.in-support.top now.`,
    c: `Reminder: your mutual fund SIP of Rs 2,000 will be debited on the 5th. For details log in at https://groww.in. Never share OTP or PIN with anyone.`,
    d: `\u{1F525} VIP \u0917\u094D\u0930\u0941\u092A \u091C\u0949\u0907\u0928 \u0915\u0930\u0947\u0902! \u092A\u0915\u094D\u0915\u093E \u092E\u0941\u0928\u093E\u092B\u093E, 40% \u0939\u0930 \u092E\u0939\u0940\u0928\u0947 \u0917\u093E\u0930\u0902\u091F\u0940\u0964 \u0938\u093F\u0930\u094D\u092B \u0906\u091C, \u0938\u0940\u092E\u093F\u0924 \u0938\u0940\u091F\u0964 \u0930\u091C\u093F\u0938\u094D\u091F\u094D\u0930\u0947\u0936\u0928 \u092B\u0940\u0938 5000 \u0930\u0941\u092A\u092F\u0947 9876543210@ybl \u092A\u0930 \u092D\u0947\u091C\u0947\u0902\u0964 \u0915\u093F\u0938\u0940 \u0915\u094B \u092E\u0924 \u092C\u0924\u093E\u0928\u093E\u0964`,
    g: `12/09/2026, 10:02 - Admin Rahul: Welcome to VIP Profit Group! Guaranteed 30% monthly returns.
12/09/2026, 10:05 - Admin Rahul: Buy above 245 target 260 stop loss 238. Sure shot call.
12/09/2026, 10:30 - Neha: Thank you sir, I made 18000 today!
12/09/2026, 11:00 - Admin Rahul: Last chance, only 5 seats left. Pay 4999 fee to rahulvip@ybl and join premium channel.
12/09/2026, 11:10 - Admin Rahul: Don't tell anyone outside the group.
12/09/2026, 11:12 - Amit: Mine too sir, upper circuit today!`
  };
  var verdict = (L, s, n) => `<div class="v ${L}"><div class="big">${ICON[L]} ${t("v_" + L)}</div><p>${t("v_" + L + "S")}</p><div class="bar"><i style="width:${Math.max(s, 3)}%"></i></div><small>${fmt(t("score"), { s, n })}</small><div class="row"><button class="say">\u{1F50A} ${t("read")}</button><button class="cp">\u{1F4CB} ${t("copy")}</button></div></div>`;
  var rp = (f) => rule(f.id, { ...f.p, h: f.p.h || f.ev[0] });
  var signs = (fl) => `<ul class="fs">${[...fl].sort((a, b) => b.w - a.w).map((f) => {
    const [ti, why] = rp(f);
    const ev = f.ev.length ? `<div class="ev">${t("found")} ${f.ev.map((e) => "\u201C" + esc(e.slice(0, 60)) + "\u201D").join(", ")}</div>` : f.p.c ? `<div class="ev">${fmt(t("gcount"), { n: f.p.c })}</div>` : "";
    return `<li class="fl ${f.w >= 25 ? "h" : "m"}"><b>${esc(ti)}</b><span class="tag">${f.w >= 25 ? t("ser") : t("warn")}</span>${ev}<p>${esc(why)}</p></li>`;
  }).join("")}</ul>`;
  var todo = (L) => `<h3>${t("todo")}</h3><ul>${steps(L).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  function wire(root, L, fl, score) {
    const ti = fl.map((f) => rp(f)[0]), say = root.querySelector(".say"), cp = root.querySelector(".cp");
    const spoken = `${t("v_" + L)}. ${t("v_" + L + "S")} ${ti.join(". ")}. ${steps(L).slice(0, 2).join(" ")}`;
    if (!("speechSynthesis" in window)) say.remove();
    else say.onclick = () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        return;
      }
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = lang === "hi" ? "hi-IN" : "en-IN";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    };
    cp.onclick = async (e) => {
      try {
        await navigator.clipboard.writeText(`Bharosa Check: ${t("v_" + L)} (${score}/100). ${ti.join("; ")}. 1930 / cybercrime.gov.in`);
        e.target.textContent = "\u2705 " + t("copied");
      } catch {
        e.target.textContent = t("nocopy");
      }
    };
  }
  function render(raw) {
    last = raw;
    const r = analyze(raw), L = level(r.score);
    let o = "", p = 0;
    for (const [a, b, c] of [...r.marks].sort((x, y) => x[0] - y[0])) {
      if (a < p) continue;
      o += esc(r.text.slice(p, a)) + `<mark class="${c}">${esc(r.text.slice(a, b))}</mark>`;
      p = b;
    }
    o += esc(r.text.slice(p));
    $("#out").innerHTML = verdict(L, r.score, r.flags.length) + `<div class="card"><h3 style="margin-top:0">${t("looked")}</h3><div class="msg">${o}</div><p class="note">${t("hl")}</p>` + (r.flags.length ? `<h3>${t("signs")}</h3>${signs(r.flags)}` : "") + (r.notes.length ? `<h3>${t("noted")}</h3><ul>${r.notes.map((n) => `<li class="note ok">${esc(note(n.id, n.p))}</li>`).join("")}</ul>` : "") + todo(L) + `<h3>${t("sure")}</h3><p class="note">${t("sureT")}</p></div>`;
    wire($("#out"), L, r.flags, r.score);
    $("#out").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderG(raw) {
    lastG = raw;
    const g = analyzeGroup(raw), L = level(g.score), worst = [...g.msgs].sort((a, b) => b.r.score - a.r.score).slice(0, 3).filter((m) => m.r.score > 0);
    $("#gout").innerHTML = verdict(L, g.score, g.flags.length) + `<div class="card"><p><b>${fmt(t("gsum"), { n: g.msgs.length, s: g.senders, r: g.risky })}</b></p>` + (g.flags.length ? `<h3>${t("signs")}</h3>${signs(g.flags)}` : "") + (worst.length ? `<h3>${t("gworst")}</h3>` + worst.map((m) => `<div class="msg" style="margin-bottom:8px"><b>${esc(m.who)}</b> (${m.r.score}/100)
${esc(m.text.slice(0, 160))}</div>`).join("") : "") + todo(L) + `</div>`;
    wire($("#gout"), L, g.flags, g.score);
    $("#gout").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i]").forEach((e) => e.textContent = t(e.dataset.i));
    $$("[data-p]").forEach((e) => e.placeholder = t(e.dataset.p));
    $("#paid").innerHTML = LG[lang].paid.map((x) => `<li>${esc(x)}</li>`).join("");
    $("#lang").textContent = lang === "hi" ? "English" : "\u0939\u093F\u0928\u094D\u0926\u0940";
    if (last) render(last);
    if (lastG) renderG(lastG);
  }
  var run = () => {
    const v = $("#in").value.trim();
    if (v.length < 12) {
      $("#out").innerHTML = `<div class="card">${t("empty")}</div>`;
      return;
    }
    render(v);
  };
  $("#go").onclick = run;
  $("#clr").onclick = () => {
    $("#in").value = "";
    $("#out").innerHTML = "";
    last = null;
    window.speechSynthesis && speechSynthesis.cancel();
  };
  $$(".chip").forEach((b) => b.onclick = () => {
    $("#in").value = S[b.dataset.s];
    run();
  });
  $("#shot").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    $("#out").innerHTML = `<div class="card" id="ocrs">${t("ocr")}</div>`;
    try {
      $("#in").value = (await ocr(f, lang, (p) => {
        const s = $("#ocrs");
        if (s) s.textContent = `${t("ocr")} ${p}%`;
      })).trim();
      run();
    } catch {
      $("#out").innerHTML = `<div class="card">${t("ocrfail")}</div>`;
    }
    e.target.value = "";
  };
  $("#ggo").onclick = () => {
    const v = $("#gin").value.trim();
    if (v.length < 20) {
      $("#gout").innerHTML = `<div class="card">${t("empty")}</div>`;
      return;
    }
    renderG(v);
  };
  $("#gex").onclick = () => {
    $("#gin").value = S.g;
    $("#ggo").click();
  };
  $$("nav button").forEach((b) => b.onclick = () => {
    $$("nav button").forEach((x) => x.setAttribute("aria-selected", x === b));
    ["chk", "grp", "paid"].forEach((k) => $("#p-" + k).classList.toggle("hid", k !== b.dataset.t));
  });
  $("#lang").onclick = () => {
    lang = lang === "hi" ? "en" : "hi";
    store.set("lang", lang);
    applyLang();
  };
  var big = false;
  $("#fs").onclick = () => {
    big = !big;
    document.documentElement.style.fontSize = big ? "125%" : "";
  };
  var q = new URLSearchParams(location.search);
  var shared = ["title", "text", "url"].map((k) => q.get(k)).filter(Boolean).join("\n");
  applyLang();
  if (shared) {
    $("#in").value = shared;
    run();
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {
  });
})();
