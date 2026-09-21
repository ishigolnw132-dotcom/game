export function appUrl(path=''){
 const clean=path.replace(/^\/+/, '');
 if(typeof document!=='undefined')return new URL(clean,document.baseURI).toString();
 return '/'+clean;
}
export function appPath(path=''){
 try{const u=new URL(appUrl(path));return u.pathname+u.search+u.hash}catch{return '/'+path.replace(/^\/+/, '')}
}
