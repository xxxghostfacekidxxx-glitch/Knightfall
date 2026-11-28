function words(s){return String(s).toLowerCase().match(/[a-z]+|[0-9]+|[.!?,;:]/g)||[];}

function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

function layout(n,d,c){let k=0;const alloc=len=>{let a=k;k+=len;return a;};return {e:alloc(n*d),pos:alloc(c*d),q:alloc(d*d),k:alloc(d*d),v:alloc(d*d),o:alloc(d*d),f:alloc(d*d),u:alloc(n*d),b:alloc(n),count:k};}

function rowsFor(examples,vocab,c){const m=new Map(vocab.map((x,i)=>[x,i])),ids=s=>words(s).map(t=>m.get(t)??3),rows=[];for(const [prompt,answer] of examples){const seq=prompt?[1,...ids(prompt),4]:[1];for(const y of [...ids(answer),2]){rows.push({x:seq.slice(-c),y});seq.push(y);}}return rows;}

function forward(w,n,d,c,x,L){const T=x.length,H=new Float64Array(T*d),Q=new Float64Array(d),K=new Float64Array(T*d),V=new Float64Array(T*d),A=new Float64Array(T),Z=new Float64Array(d),R=new Float64Array(d),F=new Float64Array(d),U=new Float64Array(d),P=new Float64Array(n),last=(T-1)*d,scale=1/Math.sqrt(d);
 for(let t=0;t<T;t++)for(let j=0;j<d;j++)H[t*d+j]=w[L.e+x[t]*d+j]+w[L.pos+(c-T+t)*d+j];
 for(let j=0;j<d;j++){for(let i=0;i<d;i++)Q[j]+=H[last+i]*w[L.q+i*d+j];for(let t=0;t<T;t++)for(let i=0;i<d;i++){K[t*d+j]+=H[t*d+i]*w[L.k+i*d+j];V[t*d+j]+=H[t*d+i]*w[L.v+i*d+j];}}
 let max=-Infinity,sum=0;for(let t=0;t<T;t++){for(let j=0;j<d;j++)A[t]+=Q[j]*K[t*d+j]*scale;max=Math.max(max,A[t]);}for(let t=0;t<T;t++){A[t]=Math.exp(A[t]-max);sum+=A[t];}for(let t=0;t<T;t++){A[t]/=sum;for(let j=0;j<d;j++)Z[j]+=A[t]*V[t*d+j];}
 for(let j=0;j<d;j++){R[j]=H[last+j];for(let i=0;i<d;i++)R[j]+=Z[i]*w[L.o+i*d+j];}
 for(let j=0;j<d;j++){let z=0;for(let i=0;i<d;i++)z+=R[i]*w[L.f+i*d+j];F[j]=Math.tanh(z);U[j]=R[j]+F[j];}
 max=-Infinity;sum=0;for(let k=0;k<n;k++){let z=w[L.b+k];for(let j=0;j<d;j++)z+=U[j]*w[L.u+k*d+j];P[k]=z;max=Math.max(max,z);}for(let k=0;k<n;k++){P[k]=Math.exp(P[k]-max);sum+=P[k];}for(let k=0;k<n;k++)P[k]/=sum;return {H,Q,K,V,A,Z,R,F,U,P};}

function gradient(w,n,d,c,row,L,g){const {x,y}=row,T=x.length,last=(T-1)*d,scale=1/Math.sqrt(d),{H,Q,K,V,A,Z,R,F,U,P}=forward(w,n,d,c,x,L),dU=new Float64Array(d),dR=new Float64Array(d),dZ=new Float64Array(d),dQ=new Float64Array(d),dA=new Float64Array(T),dH=new Float64Array(T*d);P[y]-=1;
 for(let k=0;k<n;k++){g[L.b+k]+=P[k];for(let j=0;j<d;j++){g[L.u+k*d+j]+=P[k]*U[j];dU[j]+=P[k]*w[L.u+k*d+j];}}
 dR.set(dU);for(let j=0;j<d;j++){const a=dU[j]*(1-F[j]*F[j]);for(let i=0;i<d;i++){g[L.f+i*d+j]+=R[i]*a;dR[i]+=w[L.f+i*d+j]*a;}}
 for(let j=0;j<d;j++){dH[last+j]+=dR[j];for(let i=0;i<d;i++){g[L.o+i*d+j]+=Z[i]*dR[j];dZ[i]+=w[L.o+i*d+j]*dR[j];}}
 let weighted=0;for(let t=0;t<T;t++){for(let j=0;j<d;j++)dA[t]+=dZ[j]*V[t*d+j];weighted+=A[t]*dA[t];}
 for(let t=0;t<T;t++){const ds=A[t]*(dA[t]-weighted)*scale;for(let j=0;j<d;j++){dQ[j]+=ds*K[t*d+j];const dk=ds*Q[j],dv=A[t]*dZ[j];for(let i=0;i<d;i++){g[L.k+i*d+j]+=H[t*d+i]*dk;g[L.v+i*d+j]+=H[t*d+i]*dv;dH[t*d+i]+=w[L.k+i*d+j]*dk+w[L.v+i*d+j]*dv;}}}
 for(let j=0;j<d;j++)for(let i=0;i<d;i++){g[L.q+i*d+j]+=H[last+i]*dQ[j];dH[last+i]+=w[L.q+i*d+j]*dQ[j];}
 for(let t=0;t<T;t++)for(let j=0;j<d;j++){g[L.e+x[t]*d+j]+=dH[t*d+j];g[L.pos+(c-T+t)*d+j]+=dH[t*d+j];}
}

function evaluate(w,vocab,d,c,rows){const L=layout(vocab.length,d,c);let loss=0,correct=0,unknown=0;for(const row of rows){const p=forward(w,vocab.length,d,c,row.x,L).P;let best=0;for(let k=1;k<p.length;k++)if(p[k]>p[best])best=k;loss-=Math.log(Math.max(p[row.y],1e-12));correct+=Number(best===row.y);unknown+=Number(row.y===3);}return {loss:loss/rows.length,accuracy:correct/rows.length,tokens:rows.length,unknown};}

function train(examples,valid,test,seed=28004,steps=6000,d=24,c=32){const vocab=["<pad>","<bos>","<eos>","<unk>","<answer>",...new Set(examples.flatMap(([p,a])=>[...words(p),...words(a)]))];const n=vocab.length,L=layout(n,d,c),random=rng(seed),w=Float64Array.from({length:L.count},()=> (random()-.5)*.18),g=new Float64Array(w.length),m=new Float64Array(w.length),v=new Float64Array(w.length),tr=rowsFor(examples,vocab,c),va=rowsFor(valid,vocab,c),te=rowsFor(test,vocab,c),before=evaluate(w,vocab,d,c,va),blindBefore=evaluate(w,vocab,d,c,te);let best=w.slice(),bestScore=before,bestStep=0;const rounds=[];
 for(let s=1;s<=steps;s++){g.fill(0);gradient(w,n,d,c,tr[Math.floor(random()*tr.length)],L,g);let norm=0;for(let j=0;j<g.length;j++)norm+=g[j]*g[j];const clip=Math.min(1,5/Math.sqrt(norm||1)),a=1-Math.pow(.9,s),b=1-Math.pow(.999,s);for(let j=0;j<w.length;j++){const q=g[j]*clip;m[j]=.9*m[j]+.1*q;v[j]=.999*v[j]+.001*q*q;w[j]-=.003*(m[j]/a)/(Math.sqrt(v[j]/b)+1e-8);}
 if(s%1000===0||s===steps){const score=evaluate(w,vocab,d,c,va);rounds.push({step:s,...score});if(score.loss<bestScore.loss){bestScore=score;best=w.slice();bestStep=s;}}}
 const weights=Array.from(best,x=>Number(x.toFixed(6)));return {schema:"chaos-core-attention-v1",architecture:{kind:"single-block causal self-attention with residual feed-forward",hidden:d,context:c,vocabulary:n,parameters:L.count},vocab,weights,metrics:{seed,steps,bestStep,trainingExamples:examples.length,validationExamples:valid.length,testExamples:test.length,before,validation:evaluate(weights,vocab,d,c,va),blindBefore,blind:evaluate(weights,vocab,d,c,te),rounds}};}

function validateCheckpoint(model){const {architecture:a,vocab,weights}=model;if(model.schema!=="chaos-core-attention-v1"||a.hidden!==24||a.context!==32||!Array.isArray(vocab)||vocab.length!==a.vocabulary||vocab.length>3000||vocab.slice(0,5).join("|")!=="<pad>|<bos>|<eos>|<unk>|<answer>"||new Set(vocab).size!==vocab.length||!Array.isArray(weights)||weights.length!==layout(vocab.length,a.hidden,a.context).count||weights.length!==a.parameters||!weights.every(Number.isFinite))throw Error("Invalid Chaos Core attention checkpoint");}

function generate(model,prompt="",seed=66,maxTokens=40){validateCheckpoint(model);if(typeof prompt!=="string"||prompt.length>300||!Number.isSafeInteger(seed)||seed<0||seed>4294967295||!Number.isSafeInteger(maxTokens)||maxTokens<1||maxTokens>64)throw Error("Invalid generation input");const {architecture:a,vocab,weights}=model,{hidden:d,context:c}=a,L=layout(vocab.length,d,c),map=new Map(vocab.map((t,i)=>[t,i])),seq=[1,...words(prompt).map(t=>map.get(t)??3),4],out=[],random=rng(seed);for(let i=0;i<maxTokens;i++){const p=forward(weights,vocab.length,d,c,seq.slice(-c),L).P;const ranked=Array.from(p,(v,k)=>({v,k})).filter(t=>t.k===2||t.k>=5).sort((a,b)=>b.v-a.v).slice(0,3);let sample=random()*ranked.reduce((s,t)=>s+t.v,0),k=ranked.at(-1).k;for(const t of ranked){sample-=t.v;if(sample<=0){k=t.k;break;}}if(k===2)break;seq.push(k);out.push(vocab[k]);}return out.join(" ").replace(/\s+([.!?,;:])/g,"$1");}
export {words,layout,rowsFor,forward,gradient,evaluate,train,validateCheckpoint,generate};
