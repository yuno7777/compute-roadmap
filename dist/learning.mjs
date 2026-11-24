export const STORAGE_KEY = 'compute-progress-v1';
const day = 86_400_000;
export function emptyProgress() {
  return {version:1, complete:{}, attempts:{}, notes:{}, bookmarks:[], last:'', goal:1, mode:'intermediate', theme:'dark'};
}
export function parseProgress(input, lessonIds) {
  if (!input || input.version !== 1 || typeof input !== 'object') throw Error('This is not a COMPUTE progress file.');
  const known=new Set(lessonIds), clean=emptyProgress();
  const entries=value=>value && typeof value==='object' && !Array.isArray(value)?Object.entries(value):[];
  clean.complete=Object.fromEntries(entries(input.complete).filter(([id,date])=>known.has(id)&&typeof date==='number'&&Number.isFinite(date)&&date>0));
  clean.notes=Object.fromEntries(entries(input.notes).filter(([id,note])=>known.has(id)&&typeof note==='string').map(([id,note])=>[id,note.slice(0,10000)]));
  clean.bookmarks=Array.isArray(input.bookmarks)?[...new Set(input.bookmarks.filter(id=>known.has(id)))]:[];
  clean.attempts=Object.fromEntries(entries(input.attempts).filter(([key,a])=>known.has(key.split(':')[0])&&a&&['correct','wrong','streak','due'].every(k=>Number.isSafeInteger(a[k])&&a[k]>=0)).map(([key,a])=>[key,{correct:a.correct,wrong:a.wrong,streak:a.streak,due:a.due}]));
  clean.last=known.has(input.last)?input.last:'';
  clean.goal=Number.isInteger(input.goal)?Math.max(1,Math.min(20,input.goal)):1;
  clean.mode=['beginner','intermediate','advanced'].includes(input.mode)?input.mode:'intermediate';
  clean.theme=input.theme==='light'?'light':'dark';
  return clean;
}
export function localDay(time) {
  const d=new Date(time);
  return [d.getFullYear(),d.getMonth(),d.getDate()].join('-');
}
function normalized(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g,' ').replace(/\s*,\s*/g,',');
}
export function score(question, answer) {
  const expected=question.answer;
  switch(question.type){
    case 'number': return String(answer).trim()!=='' && Math.abs(Number(answer)-expected)<=Math.max(1e-8,Math.abs(expected)*1e-6);
    case 'fill': return normalized(answer)===normalized(expected);
    case 'multi': return [...answer].sort().join(',')===[...expected].sort().join(',');
    case 'order':
    case 'match': return Array.isArray(answer)&&expected.length===answer.length&&expected.every((x,i)=>normalized(x)===normalized(answer[i]));
    default: return answer!==''&&Number(answer)===expected;
  }
}
export function recordAttempt(previous, correct, now=Date.now()) {
  const old=previous??{correct:0,wrong:0,streak:0};
  const streak=correct ? old.streak+1 : 0;
  const interval=correct?[1,3,7,14,30][Math.min(streak-1,4)]*day:600_000;
  return {correct:old.correct+Number(correct),wrong:old.wrong+Number(!correct),streak,due:now+interval};
}
