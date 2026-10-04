// On-device OCR via Tesseract.js (WASM). Loaded only when the user uploads a screenshot.
// The image never leaves the device; only the OCR engine and language data are downloaded once.
export async function ocr(file,lang,progress){
 if(!window.Tesseract)await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
 const w=await Tesseract.createWorker(lang==='hi'?'hin+eng':'eng',1,{logger:m=>m.status==='recognizing text'&&progress&&progress(Math.round(m.progress*100))});
 try{return(await w.recognize(file)).data.text}finally{await w.terminate()}}
