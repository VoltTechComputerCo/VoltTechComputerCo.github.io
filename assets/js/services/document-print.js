let printName='VoltTech_Document';
const clean=value=>String(value||'VoltTech_Document').replace(/\.pdf$/i,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'VoltTech_Document';
export function setDocumentPrintName(value){
  printName=clean(value);document.title=printName;
  const label=document.querySelector('#pdfFilename'),button=document.querySelector('#printButton');
  if(label)label.textContent=`${printName}.pdf`;if(button)button.disabled=false;
}
export async function printDocument(){
  document.title=printName;
  const button=document.querySelector('#printButton');if(button)button.disabled=true;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  setTimeout(()=>{window.print();if(button)button.disabled=false},120);
}
window.addEventListener('beforeprint',()=>{document.title=printName});
window.addEventListener('afterprint',()=>{document.title=printName});
