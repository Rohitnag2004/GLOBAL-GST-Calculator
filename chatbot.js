
(function(){
 const root=document.createElement('div');
 root.id="chatbot-root";
 root.innerHTML=`<div class="chatbot-box" id="cb-box">
   <div class="chat-header">AI Support <span id="cb-close" style="cursor:pointer;">✕</span></div>
   <div class="chat-msgs" id="cb-msgs"></div>
   <div class="chat-input">
     <input id="cb-input" placeholder="Type...">
     <button id="cb-send">Send</button>
   </div>
 </div>
 <button class="chatbot-btn" id="cb-btn">💬</button>`;
 document.body.appendChild(root);

 const btn=document.getElementById("cb-btn");
 const box=document.getElementById("cb-box");
 const close=document.getElementById("cb-close");
 const msgs=document.getElementById("cb-msgs");
 const input=document.getElementById("cb-input");
 const send=document.getElementById("cb-send");

 btn.onclick=()=>box.style.display="flex";
 close.onclick=()=>box.style.display="none";

 function addMsg(t,from){
   let d=document.createElement("div");
   d.className="msg "+from;
   d.textContent=t;
   msgs.appendChild(d);
   msgs.scrollTop=msgs.scrollHeight;
 }

 function reply(t){
   t=t.toLowerCase();
   if(t.includes("gst")) return "To calculate GST, enter amount and choose rate.";
   if(t.includes("hello")) return "Hello! How can I assist?";
   return "I can help with GST, tax and calculator usage.";
 }

 send.onclick=()=>{
   let t=input.value.trim();
   if(!t) return;
   addMsg(t,"user");
   input.value="";
   setTimeout(()=>addMsg(reply(t),"bot"),400);
 };
})();
