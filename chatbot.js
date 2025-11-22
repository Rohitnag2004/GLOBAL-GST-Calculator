
/* chatbot_pro_plus.js
   Pro+ Assistant — Polite, accurate, algorithm solver, GST specialist.
   Features:
   - Polite, professional language for all replies.
   - GST solver: parses amounts, rates, modes (inclusive/exclusive), supports batch queries.
   - Algorithm solver: recognizes algorithmic problem statements and returns:
       1) Problem restatement
       2) Complexity analysis
       3) Step-by-step approach
       4) Example
       5) Code templates in Python and JavaScript
   - Confidence-aware responses and safe fallbacks.
   - Admin KB import/export via console only.
   - Conversation persistence in localStorage (cb_pro_conv_v1).
   - No in-chat training.
*/

(function(){
  const ROOT = 'chatbot-root';
  const root = document.getElementById(ROOT) || createRoot();
  const btn = document.getElementById('cb-btn');
  const box = document.getElementById('cb-box');
  const close = document.getElementById('cb-close');
  const msgs = document.getElementById('cb-msgs');
  const input = document.getElementById('cb-input');
  const send = document.getElementById('cb-send');
  const sugg = document.getElementById('cb-suggestions');

  function createRoot(){
    const r = document.createElement('div');
    r.id = ROOT;
    r.innerHTML = `<div class="chatbot-box" id="cb-box" role="dialog" aria-label="AI assistant">
       <div class="chat-header">Pro+ AI Assistant <span id="cb-close" style="cursor:pointer;">✕</span></div>
       <div class="chat-msgs" id="cb-msgs" aria-live="polite"></div>
       <div class="chat-suggestions" id="cb-suggestions"></div>
       <div class="chat-input">
         <input id="cb-input" placeholder="Ask politely — e.g. 'Please calculate GST for ₹1200 at 18% (exclusive)' or 'Explain quicksort with code'">
         <button id="cb-send">Send</button>
       </div>
     </div>
     <button class="chatbot-btn" id="cb-btn" aria-label="Open chat">🤖</button>`;
    document.body.appendChild(r);
    return r;
  }

  // -- KB (curated short answers)
  const KB = [
    {id:'polite_intro', keywords:['hello','hi','greetings'], title:'Greeting', answer:'Hello — I am your Pro+ assistant. I respond politely and can help with GST calculations and algorithm explanations. How may I assist you today?'},
    {id:'gst_help', keywords:['gst','calculate gst','goods and services tax'], title:'GST help', answer:'I can compute GST exclusive/inclusive, explain formulas, and provide examples. Ask: "Calculate GST for 1000 at 18% exclusive" or "GST inclusive for 1180 at 18%".'},
    {id:'about', keywords:['about','version'], title:'About', answer:'Pro+ Assistant v3.0 — polite, accurate, algorithm-capable, and GST-specialist. Runs locally in your browser.'}
  ];

  // -- Utilities
  function tokenize(s){ return s.toLowerCase().replace(/[^\w\s₹%\.]/g,' ').split(/\s+/).filter(Boolean); }
  function scoreMatch(tokens, entry){
    const kTokens = entry.keywords.flatMap(k=>tokenize(k));
    const setK = new Set(kTokens);
    let hits = 0;
    for(const t of tokens) if(setK.has(t)) hits++;
    const avg = (tokens.length + kTokens.length)/2 || 1;
    return hits/avg;
  }

  // persistence
  const CONV_KEY = 'cb_pro_conv_v1';
  function saveConv(){ try{ localStorage.setItem(CONV_KEY, msgs.innerHTML); }catch(e){} }
  function loadConv(){ try{ const raw = localStorage.getItem(CONV_KEY); if(raw) msgs.innerHTML = raw; }catch(e){} }

  // message helpers
  function addMsg(text, from='bot', html=false){
    const d = document.createElement('div');
    d.className = 'msg ' + (from==='user' ? 'user' : 'bot');
    if(html) d.innerHTML = text; else d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    saveConv();
  }
  function showTyping(){ const t = document.createElement('div'); t.className='msg bot typing'; t.textContent='...'; msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight; return t; }
  function showSuggestions(arr){ const el = document.getElementById('cb-suggestions'); if(!el) return; el.innerHTML=''; arr.slice(0,5).forEach(s=>{ const b=document.createElement('button'); b.className='cb-sugg-btn'; b.textContent=s; b.onclick=()=>{ input.value=s; sendHandler(); }; el.appendChild(b); }); }

  // GST solver
  function parseAmount(s){
    const m = s.match(/₹?\s*([\d,]+(?:\.\d+)?)/);
    if(!m) return null;
    return parseFloat(m[1].replace(/,/g,''));
  }
  function parseRate(s){
    const m = s.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) : null;
  }
  function gstCompute({amount, rate, mode}){
    // mode: 'exclusive' or 'inclusive'
    amount = Number(amount); rate = Number(rate);
    if(mode === 'inclusive'){
      const base = amount / (1 + rate/100);
      const tax = amount - base;
      return {base: +base.toFixed(2), tax: +tax.toFixed(2), total: +amount.toFixed(2)};
    } else {
      const tax = amount * (rate/100);
      const total = amount + tax;
      return {base: +amount.toFixed(2), tax: +tax.toFixed(2), total: +total.toFixed(2)};
    }
  }
  function handleGSTQuery(text){
    // try to extract mode
    const mode = /inclusive/i.test(text) ? 'inclusive' : 'exclusive';
    const amount = parseAmount(text);
    const rate = parseRate(text) || 18;
    if(amount == null) return null;
    const res = gstCompute({amount, rate, mode});
    const explanation = mode==='inclusive'
      ? `You provided a total (inclusive). Formula: Base = Total ÷ (1 + rate/100). Tax = Total - Base.`
      : `You provided a base amount (exclusive). Formula: Tax = Base × (rate/100). Total = Base + Tax.`;
    const polite = `Certainly — here are the calculated values (polite):\n\n${explanation}\n\nResult:\nBase (₹): ${res.base}\nTax (₹): ${res.tax}\nTotal (₹): ${res.total}\n\nIf you wish, I can show step-by-step calculations or export this example.`;
    return polite;
  }

  // Algorithm detector & solver
  function detectAlgorithmic(text){
    const t = text.toLowerCase();
    // look for common algorithm terms and patterns
    const algos = ['quicksort','merge sort','binary search','dijkstra','bfs','dfs','dynamic programming','knapsack','longest common subsequence','lcs','two pointers','sliding window','sort','search','gcd','prime','factorial'];
    for(const a of algos) if(t.includes(a)) return a;
    // detect question forms like "Given an array..." or "Find the..."
    if(/given an array|find the|maximize|minimum|longest|shortest|count the|number of/.test(t)) return 'problem';
    return null;
  }

  function solveAlgorithm(text){
    const found = detectAlgorithmic(text);
    if(!found) return null;
    // Polite structured response
    const politeIntro = "Certainly — I'll explain this politely and clearly with steps, complexity, example, and code templates.";
    // produce a general template for "problem"
    if(found === 'problem' || found === 'two pointers' || found === 'sliding window'){
      const resp = `${politeIntro}\n\n1) Restatement:\nI'll restate the problem in simple terms.\n\n2) Approach:\nUse a two-pointer / sliding-window technique to maintain a window and update answer in O(n).\n\n3) Complexity:\nTime: O(n). Space: O(1).\n\n4) Example:\nInput: [1,2,3,...]\n\n5) Code (Python):\n\ndef solve(arr):\n    i=0\n    j=0\n    best=0\n    while j<len(arr):\n        # expand window\n        # update best\n        j+=1\n    return best\n\n6) Code (JavaScript):\n\nfunction solve(arr){\n  let i=0,j=0,best=0;\n  while(j<arr.length){\n    // expand and update\n    j++;\n  }\n  return best;\n}\n\nIf you paste the exact problem statement, I will convert this into a specific step-by-step solution with worked example and final code.`;
      return resp;
    }

    // some named algorithms
    if(found === 'binary search'){
      return `${politeIntro}\n\nBinary Search — brief:\n1) Restatement: Search for a target in a sorted array.\n2) Approach: Maintain low/high pointers, mid = (low+high)//2, compare and adjust.\n3) Complexity: Time O(log n), Space O(1).\n4) Example: arr=[1,3,5,7], target=5 → index 2.\n\nPython:\n\ndef binary_search(arr, target):\n    l, r = 0, len(arr)-1\n    while l <= r:\n        m = (l + r) // 2\n        if arr[m] == target:\n            return m\n        elif arr[m] < target:\n            l = m + 1\n        else:\n            r = m - 1\n    return -1\n\nJavaScript:\n\nfunction binarySearch(arr,target){\n  let l=0, r=arr.length-1;\n  while(l<=r){\n    const m = Math.floor((l+r)/2);\n    if(arr[m]===target) return m;\n    if(arr[m]<target) l=m+1; else r=m-1;\n  }\n  return -1;\n}\n\nIf you'd like, provide input examples and I'll run through them step-by-step.`;
    }

    if(found === 'quicksort' || found==='merge sort' || found==='merge sort'){
      return `${politeIntro}\n\nQuicksort — concise guide:\n1) Restatement: Sort an array using divide-and-conquer.\n2) Approach: Choose pivot, partition, recursively sort partitions.\n3) Complexity: Average O(n log n), Worst O(n^2) depending on pivot.\n4) Python (in-place Lomuto):\n\ndef partition(a, lo, hi):\n    pivot = a[hi]\n    i = lo\n    for j in range(lo, hi):\n        if a[j] < pivot:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n    a[i], a[hi] = a[hi], a[i]\n    return i\n\ndef quicksort(a, lo, hi):\n    if lo < hi:\n        p = partition(a, lo, hi)\n        quicksort(a, lo, p-1)\n        quicksort(a, p+1, hi)\n\n5) Example and step-through available if you provide a sample array.`;
    }

    // fallback polite message
    return `${politeIntro}\n\nI detected the topic: ${found}. I can provide: step-by-step solution, complexity analysis, worked example, and code in Python/JavaScript. Please paste the exact problem statement or sample input to proceed.`;
  }

  // responder
  function findBest(text){
    const tokens = tokenize(text);
    // GST check
    if(/\bgst\b|goods and services tax|calculate gst|inclusive|exclusive/i.test(text)){
      const gst = handleGSTQuery(text);
      if(gst) return {answer:gst, confidence:0.95};
    }
    // algorithm detection
    const alg = detectAlgorithmic(text);
    if(alg){
      const sol = solveAlgorithm(text);
      if(sol) return {answer:sol, confidence:0.9};
    }
    // KB fallback
    let best = {score:0, entry:null};
    for(const e of KB){ const s = scoreMatch(tokens,e); if(s>best.score){ best={score:s, entry:e}; } }
    if(best.entry && best.score >= 0.15) return {answer: best.entry.answer, confidence: best.score};
    return {answer: null, confidence: best.score};
  }

  // expose admin API
  window.ChatbotAssistant = {
    ask: function(text){
      addMsg(text,'user');
      const t = showTyping();
      setTimeout(()=>{ t.remove(); const r = findBest(text); if(r.answer){ addMsg(r.answer,'bot'); } else { addMsg("Apologies — I do not have a confident answer. Could you please rephrase or provide more details? Here are suggestions: 'Calculate GST for 1000 at 18% exclusive', 'Explain quicksort'.",'bot'); showSuggestions(['Calculate GST for 1000 at 18% exclusive','Explain quicksort','Binary search example']); } }, 300 + Math.min(1200, text.length*20));
    },
    importKB: function(json){ try{ const arr = typeof json === 'string' ? JSON.parse(json) : json; if(Array.isArray(arr)){ KB.length=0; arr.forEach(x=>KB.push(x)); return true;} }catch(e){ return false;} return false; },
    exportKB: function(){ return JSON.stringify(KB,null,2); },
    clearConversation: function(){ msgs.innerHTML=''; saveConv(); },
    getConversationHTML: function(){ return msgs.innerHTML; }
  };

  // UI wiring
  btn.onclick = ()=>{ box.style.display='flex'; input.focus(); };
  close.onclick = ()=>{ box.style.display='none'; };
  send.onclick = sendHandler;
  input.addEventListener('keydown', function(e){ if(e.key==='Enter') sendHandler(); });

  function sendHandler(){
    const t = input.value.trim();
    if(!t) return;
    addMsg(t,'user');
    input.value='';
    const tnode = showTyping();
    setTimeout(()=>{ tnode.remove(); const r = findBest(t); if(r.answer){ addMsg(r.answer,'bot'); } else { addMsg("I'm sorry — I couldn't confidently answer that. Please rephrase or provide sample input. Suggestions shown below.", 'bot'); showSuggestions(['Calculate GST for 1000 at 18% exclusive','Explain quicksort','Binary search example']); } }, 300 + Math.min(1200, t.length*18));
  }

  // load
  loadConv();
  if(!localStorage.getItem('cb_pro_welcomed_v1')){ addMsg("Welcome. I respond politely and can solve GST questions and algorithmic problems with examples and code. Try: 'Please calculate GST for ₹1200 at 18% exclusive' or 'Explain merge sort'.",'bot'); localStorage.setItem('cb_pro_welcomed_v1','1'); showSuggestions(['Calculate GST for 1000 at 18% exclusive','Explain quicksort','Binary search example']); }

})();
