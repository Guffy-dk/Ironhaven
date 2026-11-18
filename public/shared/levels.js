export function romanLevel(level){
 let n=Math.max(1,Math.floor(level)),out='';for(const [value,letters]of [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=value){out+=letters;n-=value;}return out;
}
