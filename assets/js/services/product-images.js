// Resize public supplier photographs; keep local and signed URLs on their origin.
const hosts=new Set(['www.syntech.co.za','s3.amazonaws.com','www.xyz.co.za','api.esquire.co.za','api.uselect.co.za','www.esquire.co.za','www.casey.co.za','www.noble.co.za','www.brainware.co.za']);
export function productImageUrl(source,size=480){
 try{const url=new URL(source);if(url.protocol!=='https:'||!hosts.has(url.hostname)||url.search||url.username||url.password)return source;
 const params=new URLSearchParams({url:url.href,w:String(size),h:String(size),fit:'inside',output:'webp',q:'78',we:''});return 'https://wsrv.nl/?'+params;
 }catch{return source;}
}
