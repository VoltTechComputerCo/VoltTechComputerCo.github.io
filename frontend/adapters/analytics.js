// Keep the existing production measurement ID and WhatsApp event contract.
export function startAnalytics(){
 if(!['https://volttechcomputerco.co.za','https://www.volttechcomputerco.co.za'].includes(location.origin))return;
 window.dataLayer ||= [];window.gtag ||= function(){window.dataLayer.push(arguments);};
 window.gtag('js',new Date());window.gtag('config','G-QQ3CC70MBE');
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-QQ3CC70MBE';document.head.append(script);
 document.addEventListener('click',event=>{const link=event.target.closest('a[href*="wa.me/27618435775"]');if(link)window.gtag('event','whatsapp_click',{page_path:location.pathname,link_text:link.textContent.trim()});});
}
