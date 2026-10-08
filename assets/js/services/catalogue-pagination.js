export function pageSize(value){const n=Number(value);return [10,25,50,100].includes(n)?n:10;}
export function pageWindow(total,requested,size){size=pageSize(size);const pages=Math.max(1,Math.ceil(total/size));const page=Math.max(1,Math.min(pages,Math.floor(Number(requested))||1));const start=(page-1)*size;return{page,pages,start,end:Math.min(total,start+size)};}
