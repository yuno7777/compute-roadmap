const number = (label, value, min, max, step = 1) => ({label, value, min, max, step, type:'number'});
const select = (label, ...options) => ({label, options, value:options[0], type:'select'});
const input = (label, value) => ({label, value, type:'text'});
const show = n => Number.isFinite(n) ? Number(n.toPrecision(7)).toString() : String(n);
const bits = (n, w) => ((n % 2**w + 2**w) % 2**w).toString(2).padStart(w,'0');
const indexRows = (labels, values) => labels.map((label, i) => [label, String(values[i])]);
const result = (summary, rows, active = 0, total = 0) => ({summary, rows, active, total});
const lab = (title, procedure, stages, fields, run) => ({title, procedure, stages, fields, run});
const sequence = (s, pattern) => {
  const numbers = s.trim().split(/[\s,]+/).filter(Boolean);
  if (!numbers.length || numbers.length > 30 || numbers.some(n=>!pattern.test(n) || !Number.isSafeInteger(Number(n)))) throw Error('Enter up to 30 valid whole numbers separated by commas.');
  return numbers.map(Number);
};

export function parseExpression(source) {
  const text = source.replace(/\s/g,'');
  const tokens = text.match(/\d+(?:\.\d+)?|[()+*\-\/]/g) || [];
  if (tokens.join('') !== text || !tokens.length || tokens.length > 40) throw Error('Use up to 40 numeric or operator tokens.');
  let position = 0;
  function atom() {
    const token = tokens[position++];
    if (token === '(') {
      const node = expression(0);
      if (tokens[position++] !== ')') throw Error('Expected a closing parenthesis.');
      return node;
    }
    if (!/^\d/.test(token ?? '')) throw Error('Expected a number or an opening parenthesis.');
    return {label:token, value:Number(token), children:[]};
  }
  const priority = {'+':1,'-':1,'*':2,'/':2};
  const operations = {'+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b};
  function expression(minimum) {
    let left = atom();
    while ((priority[tokens[position]] ?? -1) >= minimum) {
      const op = tokens[position++];
      const right = expression(priority[op]+1);
      left = {label:op, value:operations[op](left.value,right.value), children:[left,right]};
    }
    return left;
  }
  const root = expression(0);
  if (position !== tokens.length) throw Error('Unexpected token '+tokens[position]+'.');
  return {tokens, root};
}
function cpu(source, step) {
  const program = source.split(';').map(line=>line.trim()).filter(Boolean);
  if (!program.length || program.length > 16) throw Error('Enter 1–16 instructions separated by semicolons.');
  const memory = [0,0,0,0], registers = [0,0];
  let phase = 0, instruction = 'Ready';
  program.forEach((line,i)=>{
    const match = /^(MOV|ADD|LOAD|STORE)\s+R([01]),\s*(-?\d+)$/i.exec(line);
    if (!match) throw Error('Invalid instruction '+(i+1)+'. Use MOV R0, 3 or STORE R0, 0.');
    const [,code,r,arg] = match;
    const op=code.toUpperCase(), value=Number(arg);
    if (!Number.isSafeInteger(value) || (['LOAD','STORE'].includes(op) && (value<0 || value>3))) throw Error('Use safe integer operands and memory cells 0–3.');
    if (i*3 < step && step <= i*3+3) {
      phase=((step-1)%3);
      instruction=['Fetched ','Decoded ','Executed '][phase]+line;
    }
    if (step < (i+1)*3) return;
    if (op==='MOV') registers[r]=value|0;
    if (op==='ADD') registers[r]=(registers[r]+value)|0;
    if (op==='LOAD') registers[r]=memory[value];
    if (op==='STORE') memory[value]=registers[r];
  });
  return result(instruction, [['PC (instruction index)',Math.min(Math.floor(step/3),program.length)],['R0 · R1',registers.join(' · ')],['Memory cells 0–3',memory.join(' · ')]],phase,program.length*3);
}
const dot = (a,b) => a.reduce((sum,value,i)=>sum+value*b[i],0);
const softmax = scores => {
  const exp=scores.map(n=>Math.exp(n-Math.max(...scores)));
  const sum=exp.reduce((a,b)=>a+b,0);
  return exp.map(n=>n/sum);
};
const forward = (w1,w2,x,t) => {
  const hidden=Math.tanh(w1*x), y=w2*hidden, error=y-t;
  return {hidden,y,loss:error**2/2,g1:error*w2*(1-hidden**2)*x,g2:error*hidden};
};
export const labs = {
charge:lab('Charge crossing a wire','Change transported charge and elapsed time, then compare carrier direction with conventional current.', ['Carrier charge','Electric field','Wire cross-section'], {q:number('Charge magnitude (C)',2,0,12,.1),t:number('Time (s)',4,.1,12,.1),sign:select('Carrier sign','Negative','Positive')}, ({q,t,sign})=>result(show(q/t)+' A', [['Conventional current',q?'Toward lower potential':'No net flow'],['Carrier drift',q?(sign==='Negative'?'Opposite to current':'Along current'):'No net drift'],['Rate',q+' C ÷ '+t+' s']],2)),
ohm:lab('Resistor circuit','Change the source and resistance. Two ideal resistors are connected in the selected topology.', ['Voltage source','Resistor network','Power'],{v:number('Source (V)',6,0,24,.1),a:number('R₁ (Ω)',20,1,100),b:number('R₂ (Ω)',10,1,100),mode:select('Connection','Series','Parallel')},({v,a,b,mode})=>{
  const series=mode==='Series', r=series?a+b:1/(1/a+1/b), i=v/r;
  return result(show(i)+' A total',[['Equivalent resistance',show(r)+' Ω'],['Current through R₁',show(series?i:v/a)+' A'],['Current through R₂',show(series?i:v/b)+' A'],['Source power',show(v*i)+' W']],1);
}),
diode:lab('PN junction bias','Vary junction voltage. The ideal diode equation uses n = 1, Vₜ = 0.02585 V and Iₛ = 1 pA.', ['P region','Depletion region','N region'],{v:number('Junction bias (V)',.5,-.6,.6,.01)},({v})=>result(show(1e-12*Math.expm1(v/.02585))+' A',[['Bias',v>0?'Forward':v<0?'Reverse':'Equilibrium'],['Barrier',v>0?'Lower':v<0?'Higher':'Built-in potential']],1)),
cmos:lab('CMOS inverter','Toggle the gate. Compare the switch state and ideal switching power at 100 MHz and 10 fF.', ['Input gate','Complementary pair','Output rail'], {bit:select('Input','0','1'),v:number('Supply V (V)',1,.1,5,.1),a:number('Switching activity',.5,0,1,.05)},({bit,v,a})=>result('Output '+(bit==='0'?'HIGH':'LOW'), [['pMOS',bit==='0'?'On':'Off'],['nMOS',bit==='1'?'On':'Off'],['Dynamic power',show(a*10e-15*v*v*1e8*1e6)+' μW']],2)),
logic:lab('Logic and NAND construction','Choose a direct gate or a NAND-only circuit. Compare every row of its truth table.', ['Input A, B','Gate network','Output Y'],{a:select('A','0','1'),b:select('B','0','1'),gate:select('Gate network','NAND','AND','OR','XOR','NAND(A,A) → NAND with NAND(B,B)','NAND(A,B) → tied NAND')},({a,b,gate})=>{
  const nand=(x,y)=>1-(x&y);
  const run=(x,y)=>({NAND:nand(x,y),AND:x&y,OR:x|y,XOR:x^y,'NAND(A,A) → NAND with NAND(B,B)':nand(nand(x,x),nand(y,y)),'NAND(A,B) → tied NAND':nand(nand(x,y),nand(x,y))})[gate];
  return result('Y = '+run(+a,+b),[[0,0],[0,1],[1,0],[1,1]].map(([x,y])=>['A = '+x+' · B = '+y,run(x,y)]),2);
}),
alu:lab('Four-bit ALU','Compare arithmetic and bitwise operations. The low four bits are retained.', ['Operands','ALU operation','Result and flags'],{a:number('A',7,0,15),b:number('B',1,0,15),op:select('Operation','ADD','AND','XOR','OR')},({a,b,op})=>{
  const n=({ADD:a+b,AND:a&b,XOR:a^b,OR:a|b})[op], low=n&15;
  return result(bits(low,4),[['A · B',bits(a,4)+' · '+bits(b,4)],['Carry-out',Number(n>15)],['Signed overflow',op==='ADD' && (a&8)===(b&8) && (a&8)!==(low&8)?'Yes':'No'],['Zero flag',Number(low===0)]],2);
}),
bits:lab('Bit pattern explorer','Choose a byte value and compare its unsigned and two’s-complement readings.', ['Decimal input','8-bit pattern','Signed and hex'],{n:number('Byte value',255,-128,255)},({n})=>{
  const u=n&255;return result(bits(u,8),[['Unsigned',u],['Signed',u>=128?u-256:u],['Hex','0x'+u.toString(16).toUpperCase().padStart(2,'0')]],1);
}),
float:lab('Floating-point inspector','Look at a true IEEE 754 binary32 conversion via DataView.', ['Decimal value','Round to binary32','Sign, exponent, fraction'], {n:input('Decimal number','0.1')},({n})=>{
  if (n.trim()==='' || Number.isNaN(Number(n))) throw Error('Enter a decimal number such as 0.1.');
  const d=new DataView(new ArrayBuffer(4)); d.setFloat32(0, Number(n));
  const b=bits(d.getUint32(0),32);
  return result(String(d.getFloat32(0)),[['Sign',b.slice(0,1)],['Exponent',b.slice(1,9)+' ('+parseInt(b.slice(1,9),2)+')'],['Fraction',b.slice(9)]],2);
}),
cpu:lab('Instruction stepper','Use MOV, ADD, LOAD and STORE, with R0 or R1. Separate instructions with semicolons. Memory has four cells.', ['Fetch','Decode','Execute'],{program:input('Program','MOV R0, 3; ADD R0, 2; STORE R0, 0')},({program},step)=>cpu(program,step)),
cache:lab('Direct-mapped cache','Step byte addresses through a cache. Inspect the index, matched tag, and hit or miss result.', ['Byte address','Index and tag','Hit or fill'],{addresses:input('Addresses','0, 3, 16, 0'),line:select('Bytes per line','4','8','16'),count:select('Number of lines','4','2','8')},({addresses,line,count},step)=>{
  const addressesList=sequence(addresses,/^\d+$/), cache=Array(Number(count)).fill(null);
  let hits=0, status='Ready', last='—';
  addressesList.slice(0,step).forEach(n=>{
    const block=Math.floor(n/line), i=block%count, tag=Math.floor(block/count), hit=cache[i]===tag;
    if(hit) hits++;
    cache[i]=tag;
    status=hit?'Cache hit':'Cache miss';
    last=n+' → index '+i+', tag '+tag;
  });
  return result(status,[['Last access',last], ['Tags by index',cache.map(n=>n??'empty').join(' · ')],['Hits',hits+' of '+Math.min(step,addressesList.length)]],step?2:0,addressesList.length);
}),
pipeline:lab('Branch predictor','Step taken (T) and not-taken (N) outcomes. Each miss adds two illustrative recovery cycles.', ['Predict','Resolve branch','Recover or continue'],{outcomes:input('Outcomes','T T T N T T T N'),kind:select('Predictor','Two-bit saturating','One-bit')},({outcomes,kind},step)=>{
  const seq=outcomes.trim().toUpperCase().replace(/[\s,]/g,'');
  if(!/^[TN]{1,40}$/.test(seq)) throw Error('Enter up to 40 T or N outcomes.');
  let state=kind==='One-bit'?0:1, misses=0, prediction='—', outcome='—';
  const one=kind==='One-bit';
  [...seq.slice(0,step)].forEach(letter=>{
    const actual=letter==='T'; prediction=state>=(one?1:2)?'T':'N'; outcome=letter;
    if(prediction!==letter) misses++;
    state=Math.max(0,Math.min(one?1:3,state+(actual?1:-1)));
  });
  return result(step?prediction===outcome?'Correct prediction':'Misprediction':'Ready',[['Prediction · outcome',prediction+' · '+outcome],['Predictor state',state],['Mispredictions',misses],['Added recovery cycles',misses*2]],step?2:0,seq.length);
}),
schedule:lab('CPU scheduler','Three jobs arrive at time zero. Each step is one CPU tick. Context-switch overhead is omitted.', ['Ready queue','Run on CPU','Completion'],{jobs:input('Job lengths','5, 2, 1'),policy:select('Scheduling policy','Round robin','First-come first-served'),q:number('Time quantum',2,1,10)},({jobs,policy,q},step)=>{
  const durations=sequence(jobs,/^[1-9]\d?$/);
  if(durations.length!==3) throw Error('Enter three positive job lengths, each no larger than 99.');
  const remaining=[...durations], queue=[0,1,2], timeline=[], complete=['—','—','—'];
  const total=durations.reduce((a,b)=>a+b,0);
  let used=0;
  for(let tick=0;tick<Math.min(step,total);tick++){
    const running=queue[0];
    timeline.push('ABC'[running]); used++;
    if(--remaining[running]===0){complete[running]=tick+1;queue.shift();used=0;}
    else if(policy==='Round robin' && used===q){queue.push(queue.shift());used=0;}
  }
  return result(timeline.length?'CPU time '+timeline.length:'Ready',[['Timeline',timeline.join(' ')||'—'],['Remaining A · B · C',remaining.join(' · ')],['Completion A · B · C',complete.join(' · ')]],step?1:0,total);
}),
pages:lab('Page-table walker','Translate a byte address through a fixed page table. Page 1 is unmapped.', ['Virtual address','Page table','Physical address'],{address:number('Byte address',9029,0,65535),size:select('Page size in bytes','4096','1024','2048')},({address,size})=>{
  const page=Math.floor(address/size), offset=address%size, frame=({0:4,2:7,3:1})[page], physical=frame===undefined?null:frame*size+offset;
  return result(physical===null?'Page fault':'Physical 0x'+physical.toString(16),[['Virtual page number',page],['Byte offset',offset],['Physical frame',frame??'Unmapped']],physical===null?1:2);
}),
lifetime:lab('Ownership and lifetime','Choose a lifetime event and follow the state of a simplified resource.', ['Create owner A','Use binding B','Drop A'],{operation:select('Binding operation','Move to B','Borrow A from B','Clone into B')},({operation})=>result(operation==='Borrow A from B'?'Drop must wait until B’s last use':'B remains valid',[['Owner before operation','A'],['B after operation',operation==='Move to B'?'Owner':operation==='Borrow A from B'?'Borrower':'Owner of independent copy'],['Allocation count',operation==='Clone into B'?2:1]],2)),
parser:lab('Syntax tree','Change an arithmetic expression and compare lexing, parsing and evaluation. Binary arithmetic only.', ['Tokens','Abstract syntax tree','Value'],{expr:input('Expression','2+3*4')},({expr},step)=>{
  const {tokens,root}=parseExpression(expr);
  const tree=n=>n.children.length?'('+n.label+' '+n.children.map(tree).join(' ')+')':n.label;
  return result(['Lexed '+tokens.length+' tokens','Root operator or literal: '+root.label,'Evaluates to '+show(root.value)][step],[['Tokens',tokens.join('  ')],['Tree (prefix form)',step?tree(root):'Step to parse'],['Value',step===2?show(root.value):'Step to evaluate']],step,2);
}),
search:lab('Binary search','Set a target. Each step compares one item and narrows the remaining sorted interval.', ['Remaining interval','Middle comparison','Retained half'],{target:number('Target',12,-10,50)},({target},step)=>{
  const arr=[1,4,8,12,20,27], trace=[];
  let lo=0,hi=arr.length-1,found=false;
  while(lo<=hi && !found){
    const middle=lo+Math.floor((hi-lo)/2), value=arr[middle], before=lo+'–'+hi;
    if(value===target) found=true;
    else if(value<target) lo=middle+1;
    else hi=middle-1;
    trace.push({before,value,middle,after:found?'Match':lo<=hi?lo+'–'+hi:'Empty'});
  }
  const item=trace[Math.min(step,trace.length)-1];
  return result(item?item.after==='Match'?'Found':item.after==='Empty'?'No match':'Compared '+item.value:'Ready',[['Sorted array',arr.join(' · ')],['Previous interval',item?.before??'0–5'],['Middle (zero-based)',item?.middle??'—'],['Next interval',item?.after??'0–5']],step?2:0,trace.length);
}),
route:lab('Packet forwarding','Two routers forward the packet. Each link uses a different frame. TTL decreases once per forwarding hop.', ['Source host','Router A','Router B','Destination'],{ttl:number('Initial IPv4 TTL',3,1,12)},({ttl},step)=>{
  const hop=Math.min(step,ttl,3), expired=hop===ttl && hop<3, remaining=Math.max(0,ttl-Math.min(hop,2));
  return result(expired?'Discarded at router '+'AB'[hop-1]:['Ready at source','Forwarded by router A','Forwarded by router B','Delivered'][hop],[['IP path','192.0.2.2 → 203.0.113.9'],['Link frame',expired?'None': ['Source → A','A → B','B → Destination','Arrived'][hop]],['Remaining TTL',remaining]],hop,Math.min(ttl,3));
}),
index:lab('Index lookup','Step down a fixed B+-tree with root separators 10 and 20.', ['Root page','Leaf page','Key check'],{key:number('Search key',19,0,40)},({key},step)=>{
  const group=key<10?0:key<20?1:2, keys=[[1,4,8],[10,12,19],[20,24,32]][group];
  return result(step===2?(keys.includes(key)?'Key found':'Key absent'):step===1?'Leaf selected':'Root page',[['Separators','10 · 20'],['Leaf keys',step?keys.join(' · '):'—'],['Lookup key',key]],step,2);
}),
race:lab('Interleaved counter updates','Compare two reads followed by writes with indivisible atomic increments.', ['Worker A','Shared counter','Worker B'],{mode:select('Increment implementation','Read then write','Atomic fetch-add')},({mode},step)=>{
  const atomic=mode==='Atomic fetch-add', trace=atomic?['Ready','A increments','B increments']:['Ready','A reads 0','B reads 0','A writes 1','B writes 1'];
  return result(trace[step], [['Counter',atomic?step:step>=3?1:0],['Expected after both increments',2]],step?1:0,trace.length-1);
}),
bounds:lab('Safe slice check','Check a half-open byte interval against a fixed-size buffer.', ['Untrusted offset','Validate range','Read or reject'],{size:number('Buffer size',16,0,64),offset:number('Offset',14,0,64),length:number('Length',4,0,64)},({size,offset,length})=>{
  const valid=offset<=size && length<=size-offset;
  return result(valid?'Slice accepted':'Slice rejected',[['Requested interval','['+offset+', '+(offset+length)+')'],['Buffer interval','[0, '+size+')'],['Available bytes',Math.max(0,size-offset)]],valid?2:1);
})
};

Object.assign(labs, {
vector:lab('Vector alignment','Adjust the two vectors and compare their dot product, norms and angle.', ['Vector A','Component products','Vector B'],{x:number('Aₓ',3,-8,8),y:number('Aᵧ',4,-8,8),u:number('Bₓ',1,-8,8),v:number('Bᵧ',0,-8,8)},({x,y,u,v})=>{
  const a=Math.hypot(x,y), b=Math.hypot(u,v), d=dot([x,y],[u,v]), c=a&&b?d/(a*b):null;
  return result('Dot product '+d,[['Components',x*u+' + '+y*v],['Lengths',show(a)+' · '+show(b)],['Cosine',c===null?'Undefined':show(c)],['Angle',c===null?'Undefined':show(Math.acos(Math.max(-1,Math.min(1,c)))*180/Math.PI)+'°']],1);
}),
raster:lab('Triangle coverage','Select a pixel center on the grid. Coverage comes from three evaluated edge functions.', ['Triangle vertices','Edge functions','Pixel coverage'],{x:number('Column',2,0,8),y:number('Row',2,0,8)},({x,y})=>{
  const vertices=[[1,1],[7,1],[2,7]], edges=vertices.map(([ax,ay],i)=>{
    const [bx,by]=vertices[(i+1)%3];
    return (bx-ax)*(y+.5-ay)-(by-ay)*(x+.5-ax);
  });
  return {...result(edges.every(n=>n>=0)?'Covered':'Outside',[['Sample point',x+.5+', '+(y+.5)],...indexRows(['Edge 1','Edge 2','Edge 3'],edges)],2), grid:{x,y,vertices}};
}),
warp:lab('Warp active mask','Assign lanes 0 through n−1 to path A. The model assumes both paths use the same instruction count.', ['32 lanes','Active path masks','Lane utilization'],{n:number('Lanes taking path A',16,0,32)},({n})=>{
  const paths=n===0||n===32?1:2;
  return result(show(100/paths)+'% active per issued slot',[['Path A mask','A'.repeat(n)+'·'.repeat(32-n)],['Path B mask','·'.repeat(n)+'B'.repeat(32-n)],['Issued paths',paths]],1);
}),
gradient:lab('Regression training','Step full-batch gradient descent on (1,2), (2,4) and (3,6). The optimum is w=2.', ['Predict','Differentiate loss','Update weight'],{initial:number('Initial weight',0,-5,5,.1),rate:number('Learning rate',.1,.01,.8,.01)},({initial,rate},step)=>{
  let w=initial;
  const error=()=>w-2, gradient=()=>14/3*error();
  for(let i=0;i<step;i++) w-=rate*gradient();
  return result('Loss '+show(7/3*error()**2),[['Iteration',step],['Weight',show(w)],['Gradient for next update',show(gradient())]],step?2:0,30);
}),
backprop:lab('Two-weight neural network','Perform gradient updates through a tanh activation. Initial weights are both 0.5.', ['Forward pass','Backward pass','Update weights'],{x:number('Input x',1,-3,3,.1),target:number('Target',1,-3,3,.1),rate:number('Learning rate',.1,.01,.5,.01)},({x,target,rate},step)=>{
  let a=.5,b=.5;
  for(let i=0;i<step;i++){const {g1,g2}=forward(a,b,x,target);a-=rate*g1;b-=rate*g2;}
  const {hidden,y,loss,g1,g2}=forward(a,b,x,target);
  return result('Loss '+show(loss),indexRows(['Weights','Hidden activation','Prediction','Gradients'],[show(a)+' · '+show(b),show(hidden),show(y),show(g1)+' · '+show(g2)]),step?2:0,25);
}),
token:lab('BPE merge and embedding lookup','Apply a tiny ordered merge list. Vectors and IDs in this educational vocabulary are fixed examples.', ['Symbols','Apply merges','Read embedding rows'],{text:input('Input text','banana band')},({text},step)=>{
  let parts=[...text].slice(0,32);
  const merges=[['b','a'],['n','a'],['ba','n'],['na','na']];
  for(const [a,b] of merges.slice(0,step)){
    const merged=[];
    for(let i=0;i<parts.length;i++){
      if(parts[i]===a && parts[i+1]===b){merged.push(a+b);i++;}
      else merged.push(parts[i]);
    }
    parts=merged;
  }
  const vocab=['<unk>','a','b','n','d',' ','ba','na','ban','nana'];
  const ids=parts.map(t=>Math.max(0,vocab.indexOf(t)));
  return result(parts.length+' tokens',[['Segments',parts.map(t=>JSON.stringify(t)).join(' · ')||'Empty'],['IDs',ids.join(' · ')||'Empty'],['Example vectors',ids.map(i=>'['+show(i/10)+', '+show((10-i)/10)+']').join(' · ')||'Empty']],step?Math.min(step,2):0,merges.length);
}),
attention:lab('Attention head','Change the 2D query and visibility mask. The three keys are [1,0], [0,1] and [1,1]. Their values are 2, 4 and 8.', ['Q · K / √2','Mask and softmax','Weighted value'],{x:number('Query x',1,-6,6,.1),y:number('Query y',.5,-6,6,.1),pos:number('Query position',2,0,2),mask:select('Attention mask','Causal','None')},({x,y,pos,mask})=>{
  const scores=[x,y,x+y].map((n,i)=>mask==='Causal' && i>pos?-Infinity:n/Math.SQRT2);
  const weights=softmax(scores);
  return {...result('Output '+show(dot(weights,[2,4,8])), [['Masked scores',scores.map(show).join(' · ')],['Attention weights',weights.map(show).join(' · ')],['Sum of weights',show(weights.reduce((a,b)=>a+b,0))]],2),weights};
}),
kv:lab('KV cache budget','Change sequence length and model shape. The calculation assumes dense caches and one sequence.', ['Model dimensions','Key and value tensors','Cache bytes'],{layers:number('Layers',32,1,128),heads:number('KV heads',8,1,64),dimension:number('Head dimension',128,1,512),tokens:number('Tokens',2048,1,131072),bytes:select('Bytes per element','2','1','4')},({layers,heads,dimension,tokens,bytes})=>{
  const perToken=2*layers*heads*dimension*bytes;
  return result(show(perToken*tokens/2**20)+' MiB',[['Bytes per token',perToken.toLocaleString()],['Tokens',tokens],['Total bytes',(perToken*tokens).toLocaleString()]],2);
}),
quant:lab('Symmetric quantization','Change bit width and scale range for a fixed group of five weights.', ['Original values','Integer codes','Reconstruction'],{width:select('Bit width','4','3','8'),range:number('Calibration maximum',1,.1,5,.05)},({width,range})=>{
  const weights=[-1,-.51,-.12,.36,.87], q=2**(width-1)-1, scale=range/q;
  const codes=weights.map(w=>Math.min(q,Math.max(-q,Math.round(w/scale)))), restored=codes.map(i=>i*scale);
  const mse=weights.reduce((a,w,i)=>a+(w-restored[i])**2,0)/weights.length;
  return result('MSE '+show(mse),[['Weights',weights.join(' · ')],['Integer codes',codes.join(' · ')],['Reconstruction',restored.map(show).join(' · ')],['Scale',show(scale)]],2);
}),
yield:lab('Defect-limited die yield','Compare a single die with equally sized tiles in the Poisson defect model.', ['Defect density','Die area','Probability of zero defects'],{area:number('Total area (cm²)',4,.1,10,.1),density:number('Defect density (defects/cm²)',.2,0,2,.05),tiles:number('Number of tiles',4,1,16)},({area,density,tiles})=>{
  const mono=Math.exp(-area*density), tile=Math.exp(-area*density/tiles);
  return result(show(mono*100)+'% monolithic yield',[['Tile area',show(area/tiles)+' cm²'],['Single tile yield',show(tile*100)+'%'],['All random tiles good',show(100*tile**tiles)+'%']],2);
})
});

Object.assign(labs,{
rc:lab('RC charging curve','Sample an ideal resistor–capacitor charging circuit with a fixed 5 V step.', ['Source step','Resistor and capacitor','Output voltage'],{r:number('Resistance (kΩ)',1,.1,10,.1),c:number('Capacitance (μF)',1,.1,10,.1),t:number('Time (ms)',1,0,30,.1)},({r,c,t})=>{
  const tau=r*c, v=-5*Math.expm1(-t/tau);
  return result(show(v)+' V',[['Time constant',show(tau)+' ms'],['Capacitor charge',show(c*v)+' μC'],['Current',show((5-v)/r)+' mA']],2);
}),
flip:lab('Clocked storage','Each step is a rising edge. Feed an input bit stream to a D flip-flop or advance a two-bit counter.', ['Pending D','Rising edge','Stored output'],{data:input('Input bits','10110'),device:select('Clocked device','D flip-flop','Two-bit counter')},({data,device},step)=>{
  if(!/^[01]{1,24}$/.test(data))throw Error('Enter a string of 1–24 bits.');
  const d=device==='D flip-flop', q=d?(step?data[step-1]:'0'):bits(step,2);
  return result('Q = '+q,[['Edges completed',step],['Pending D',d?(data[step]??'—'):bits(step+1,2)],['Behavior between edges','Hold last output']],step?2:0,d?data.length:8);
}),
binding:lab('Object identity','Select an assignment strategy, then append or change a nested value through B.', ['Object A','Binding operation','Mutation through B'],{mode:select('Assignment','Alias','Shallow copy','Deep copy'),operation:select('Mutation','Append 2 to outer list','Change nested value to 7')},({mode,operation})=>{
  const a=[[1]], b=mode==='Alias'?a:mode==='Shallow copy'?[...a]:[[...a[0]]];
  if(operation==='Append 2 to outer list')b.push(2);else b[0][0]=7;
  return result(a===b?'Same outer object':'Different outer objects',[['A',JSON.stringify(a)],['B',JSON.stringify(b)],['Nested object shared',a[0]===b[0]?'Yes':'No']],2);
}),
eventloop:lab('Browser event-loop order','Use each step to advance through synchronous logging, a microtask checkpoint and a timer. Toggle when the promise is enqueued.', ['Synchronous task','Microtask checkpoint','Timer task'],{mode:select('Enqueue promise','During main task','Inside timer callback')},({mode},step)=>{
  const main=mode==='During main task', trace=main?['A','B','promise','timer']:['A','B','timer','promise'];
  const phase=step<3?0:main?step-2:4-step+1;
  return result('Output: '+(trace.slice(0,step).join(' · ')||'—'),[['Microtasks pending',main?(step===2?1:0):(step===3?1:0)],['Timer',step>=(main?4:3)?'Complete':'Pending or not yet queued']],phase,4);
}),
derivative:lab('Numerical slope','Estimate the slope of x³. Enter h in decimal or scientific notation.', ['Sample f(x±h)','Difference quotient','Compare to exact slope'],{x:number('Point x',2,-10,10,.1),h:input('Step h','0.1'),mode:select('Approximation','Central','Forward')},({x,h,mode})=>{
  const step=Number(h);
  if(!Number.isFinite(step)||step<=0||step>10)throw Error('Use a positive step no larger than 10.');
  const estimate=mode==='Central'?((x+step)**3-(x-step)**3)/(2*step):((x+step)**3-x**3)/step;
  return result('Estimated slope '+show(estimate),[['Exact derivative',show(3*x*x)],['Absolute error',show(Math.abs(estimate-3*x*x))]],2);
}),
entropy:lab('Binary entropy and cross entropy','Compare a binary source’s distribution p with a model’s probability q.', ['Source probabilities','Log surprise','Expected bits'],{p:number('Source probability of 1',.8,0,1,.01),q:number('Model probability of 1',.5,.01,.99,.01)},({p,q})=>{
  const term=(weight,probability)=>weight===0?0:-weight*Math.log2(probability);
  const entropy=term(p,p)+term(1-p,1-p), cross=term(p,q)+term(1-p,1-q);
  return result(show(entropy)+' bits of entropy',[['Surprise of 1',p?show(-Math.log2(p))+' bits':'Impossible outcome'],['Surprise of 0',p<1?show(-Math.log2(1-p))+' bits':'Impossible outcome'],['Cross entropy',show(cross)+' bits']],2);
}),
objective:lab('Training signal comparison','Vary a model’s probability of candidate A and assign rewards to both candidate responses.', ['Observed target','Negative log likelihood','Expected reward'],{p:number('Model probability of A',.5,.01,.99,.005),a:number('Reward for A',1,-3,3,.1),b:number('Reward for B',2,-3,3,.1)},({p,a,b})=>result(show(-Math.log2(p))+' bits for observed A',[['Expected reward',show(p*a+(1-p)*b)],['Higher reward',a===b?'Tie':a>b?'A':'B'],['Model’s most probable output',p===.5?'Tie':p>.5?'A':'B']],2)),
qubit:lab('Single-qubit interference','Step a sequence of X, Z and H gates from |0⟩. No measurement happens during the sequence.', ['Input amplitudes','Unitary gate','Measurement probabilities'],{program:input('Gate sequence','H Z H')},({program},step)=>{
  const gates=program.toUpperCase().replace(/[\s,]+/g,'');
  if(!/^[HXZ]{1,20}$/.test(gates))throw Error('Enter up to 20 X, Z or H gates.');
  let a=1,b=0;
  for(const gate of gates.slice(0,step)){
    if(gate==='H')[a,b]=[(a+b)/Math.SQRT2,(a-b)/Math.SQRT2];
    if(gate==='X')[a,b]=[b,a];
    if(gate==='Z')b=-b;
  }
  return result('P(1) = '+show(b*b),[['Latest gate',gates[step-1]??'None'],['Amplitudes α · β',show(a)+' · '+show(b)],['P(0)',show(a*a)]],step?2:0,gates.length);
})
});
