Pro+ Chatbot — README
--------------------
This package contains a professional Pro+ AI assistant (local, polite, algorithm solver, GST specialist).

Files included:
- index.html (your page)
- styles.css, script.js, chatbot.css (your existing UI files)
- chatbot.js (this Pro+ assistant)
- README_pro_plus.txt (this file)

Capabilities:
- Polite, professional language by default.
- GST calculations: inclusive/exclusive parsing, examples, and explanations.
- Algorithm solving: detects common algorithms or problem statements and returns:
    * Restatement
    * Approach & step-by-step plan
    * Complexity analysis
    * Example
    * Code templates in Python & JavaScript
- No in-chat training. Admin can import/export KB via console:
    window.ChatbotAssistant.importKB(json)
    window.ChatbotAssistant.exportKB()
- Conversation persisted in localStorage (cb_pro_conv_v1). All data stays local.

Usage:
- Unzip and open index.html in a modern browser.
- Use the chat button (bottom-right). Ask politely for best results.
- Programmatic usage examples:
    window.ChatbotAssistant.ask('Please calculate GST for ₹1200 at 18% exclusive')
    window.ChatbotAssistant.ask('Explain quicksort')

If you'd like, I can:
- Preload a larger GST rules KB with examples for common goods/services.
- Add an admin UI to edit the KB instead of using the console.
- Integrate an LLM backend for fully generative, up-to-date answers (requires server & API key).