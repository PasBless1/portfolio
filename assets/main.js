// ── SCROLL PROGRESS ──
const bar=document.getElementById('progress-bar');
window.addEventListener('scroll',()=>{
    const range=document.documentElement.scrollHeight-window.innerHeight;
    const pct=range>0?Math.min(100,Math.max(0,window.scrollY/range*100)):0;
    bar.style.width=pct+'%';
},{passive:true});

// ── CURSOR GLOW ──
const glow=document.getElementById('cursor-glow');
let _raf;
window.addEventListener('mousemove',e=>{
    cancelAnimationFrame(_raf);
    _raf=requestAnimationFrame(()=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';});
});

// ── THEME TOGGLE ──
(function(){
    let saved='dark';try{saved=localStorage.getItem('theme')||'dark'}catch{};
    if(saved==='light')document.documentElement.setAttribute('data-theme','light');
    const icon=document.getElementById('theme-icon');
    if(icon&&saved==='light')icon.className='fas fa-moon';
})();
function toggleTheme(){
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    const next=isLight?'dark':'light';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next)}catch{};
    document.getElementById('theme-btn').setAttribute('aria-label',next==='light'?'Switch to dark mode':'Switch to light mode');
    document.getElementById('theme-icon').className=isLight?'fas fa-sun':'fas fa-moon';
}

// ── NAV: active + scrolled ──
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>30),{passive:true});

// ── HAMBURGER MENU ──
let menuOpen=false;
function toggleMenu(force){
    menuOpen=typeof force==='boolean'?force:!menuOpen;
    const icon=document.getElementById('ham-icon');
    const button=document.querySelector('.hamburger');
    navbar.classList.toggle('menu-open',menuOpen);
    icon.className=menuOpen?'fas fa-times':'fas fa-bars';
    button.setAttribute('aria-expanded',String(menuOpen));
    button.setAttribute('aria-label',menuOpen?'Close navigation menu':'Open navigation menu');
}
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
window.addEventListener('resize',()=>{if(window.innerWidth>760&&menuOpen)toggleMenu(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuOpen){toggleMenu(false);document.querySelector('.hamburger').focus()}});

// ── REVEAL ON SCROLL ──
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
const revealElements=document.querySelectorAll('.reveal');
// Restart the stagger in each group instead of accumulating delays across the page.
document.querySelectorAll('.skills-grid,.projects-grid,.certs-grid,.timeline').forEach(group=>{
    group.querySelectorAll('.reveal').forEach((el,i)=>{
        el.style.transitionDelay=Math.min(i,3)*65+'ms';
    });
});
if('IntersectionObserver' in window&&!reducedMotion.matches){
    const revealObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}
        });
    },{threshold:0.06});
    revealElements.forEach(el=>revealObserver.observe(el));
}else{revealElements.forEach(el=>el.classList.add('visible'))}

// Give the existing card glow a gently tracked centre, with one update per frame.
document.querySelectorAll('.glass').forEach(card=>{
    let frame=0;
    card.addEventListener('pointermove',event=>{
        if(reducedMotion.matches||!finePointer.matches)return;
        cancelAnimationFrame(frame);
        const x=event.clientX,y=event.clientY;
        frame=requestAnimationFrame(()=>{
            const bounds=card.getBoundingClientRect();
            if(!bounds.width||!bounds.height)return;
            card.style.setProperty('--gx',((x-bounds.left)/bounds.width*100)+'%');
            card.style.setProperty('--gy',((y-bounds.top)/bounds.height*100)+'%');
        });
    },{passive:true});
    card.addEventListener('pointerleave',()=>{
        cancelAnimationFrame(frame);card.style.removeProperty('--gx');card.style.removeProperty('--gy');
    });
});

// ══ MODERNIZATION JS ══

// ── SECTION WATERMARK NUMBERS ──
document.querySelectorAll('section[id]:not(#hero) .section-header').forEach((h,i)=>{
    const sw=document.createElement('span');
    sw.className='sw';sw.setAttribute('aria-hidden','true');
    sw.textContent=String(i+1).padStart(2,'0');
    h.appendChild(sw);
});

// ── COUNTER ANIMATION ──
function animateCounter(el){
    const target=Number(el.dataset.target);
    if(!Number.isFinite(target))return;
    const suffix=target===80?'+':target===3?'×':'';
    if(reducedMotion.matches){el.textContent=target+suffix;return}
    const started=performance.now();
    const duration=1150;
    function tick(now){
        if(reducedMotion.matches){el.textContent=target+suffix;return}
        const progress=Math.min(1,Math.max(0,(now-started)/duration));
        const eased=1-Math.pow(1-progress,3);
        el.textContent=Math.floor(target*eased)+suffix;
        if(progress<1)requestAnimationFrame(tick);
        else el.textContent=target+suffix;
    }
    requestAnimationFrame(tick);
}
const statsSection=document.querySelector('.hero-stats');
if(statsSection&&'IntersectionObserver' in window&&!reducedMotion.matches){
    const statsObserver=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
            document.querySelectorAll('.hero-stat-num[data-target]').forEach(animateCounter);
            statsObserver.disconnect();
        }
    },{threshold:0.3});
    statsObserver.observe(statsSection);
}
reducedMotion.addEventListener('change',event=>{
    if(event.matches)revealElements.forEach(el=>{el.style.transitionDelay='0ms';el.classList.add('visible')});
});

// ── CONTACT FORM (Formspree async) ──
const _cf=document.getElementById('contact-form');
if(_cf){_cf.addEventListener('submit',async e=>{
 e.preventDefault();if(!_cf.reportValidity())return;
 const btn=_cf.querySelector('[type=submit]');if(btn.disabled)return;
 const success=document.getElementById('form-success'),error=document.getElementById('form-error');
 const originalButton=btn.innerHTML;success.hidden=true;error.hidden=true;
 btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Sending…';_cf.setAttribute('aria-busy','true');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(_cf.action,{method:'POST',body:new FormData(_cf),headers:{Accept:'application/json'},signal:controller.signal});
  if(!response.ok)throw new Error('Delivery failed');
  _cf.reset();success.hidden=false;
 }catch{error.hidden=false}
 finally{clearTimeout(timeout);btn.disabled=false;btn.innerHTML=originalButton;_cf.removeAttribute('aria-busy')}
});}


// ══ MOTION POLISH ══
(()=>{
document.documentElement.classList.add('js-ready');
const rm=window.matchMedia('(prefers-reduced-motion: reduce)');

// stagger index for tag cascades
document.querySelectorAll('.skill-tags,.tech-pills').forEach(g=>[...g.children].forEach((el,i)=>el.style.setProperty('--i',Math.min(i,10))));

// sliding active pill in the nav
const menu=document.getElementById('nav-menu');
const ind=document.createElement('li');
ind.className='nav-ind';ind.setAttribute('aria-hidden','true');menu.prepend(ind);
function placeInd(){
    const a=menu.querySelector('a.active:not(.nav-cta)');
    if(!a||window.innerWidth<=760){ind.style.opacity='0';return}
    ind.style.opacity='1';
    ind.style.width=a.offsetWidth+'px';ind.style.height=a.offsetHeight+'px';
    ind.style.transform=`translate(${a.offsetLeft}px,${a.offsetTop}px)`;
}

// timeline fill + lit dots
const tl=document.querySelector('.timeline');
const tlItems=[...document.querySelectorAll('.tl-item')];
function updateTimeline(){
    if(!tl)return;
    const r=tl.getBoundingClientRect(),mark=window.innerHeight*.65;
    tl.style.setProperty('--tl',Math.min(1,Math.max(0,(mark-r.top)/r.height)).toFixed(4));
    tlItems.forEach(it=>{const d=it.querySelector('.tl-dot');if(d)it.classList.toggle('lit',d.getBoundingClientRect().top<mark)});
}

// back-to-top ring
const toTop=document.getElementById('to-top'),ring=toTop.querySelector('circle');
const C=2*Math.PI*23;ring.style.strokeDasharray=C;
function updateTop(){
    const max=document.documentElement.scrollHeight-window.innerHeight;
    ring.style.strokeDashoffset=C*(1-(max>0?window.scrollY/max:0));
    toTop.classList.toggle('show',window.scrollY>window.innerHeight*.8);
}
toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:rm.matches?'auto':'smooth'}));

let ticking=false;
function update(){ticking=false;placeInd();updateTimeline();updateTop()}
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
window.addEventListener('resize',update);
if(document.fonts)document.fonts.ready.then(update);
update();

// count up the big "80+" in Certifications
const certNum=document.querySelector('.certs-hero-num[data-target]');
if(certNum&&'IntersectionObserver' in window&&!rm.matches&&typeof animateCounter==='function'){
    const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){animateCounter(certNum);o.disconnect()}},{threshold:.5});
    o.observe(certNum);
}
})();


// ══ PIPELINE TABS ══
(()=>{
const $=s=>document.querySelector(s);
const rm=window.matchMedia('(prefers-reduced-motion: reduce)');
const stages=[
  {t:'Data',h:'Start with data you can defend.',d:'Curate multimodal sources (fundus, OCT, CT, MRI) with provenance, labelling protocol and class balance written down before any model is trained.',pk:'In practice · TU Dublin doctoral research',p:'Bringing multiple ocular imaging modalities together to study biomarkers for neurodegenerative disease.',tools:['ETL pipelines','SQL','Apache Spark','DICOM','Pandas'],lab:'Multimodal inputs'},
  {t:'Preprocessing',h:'Make every image comparable.',d:'Standardise resolution, intensity and field of view; crop, normalise and strip what is irrelevant, so the model learns anatomy instead of scanner quirks.',pk:'In practice · Brain MRI pipeline',p:'Preprocessing and skull stripping ahead of brain MRI segmentation and classification.',tools:['OpenCV','SimpleITK','Python','Pandas'],lab:'Crop · normalise · scan'},
  {t:'Architecture',h:'Match the model to the clinical question.',d:'Choose the architecture for the task, whether segmentation, grading or detection, and look at the image at more than one scale, the way a clinician does.',pk:'In practice · Hierarchical DR grading',p:'A multi-scale hierarchical network that detects diabetic retinopathy and then grades its severity.',tools:['PyTorch','TensorFlow','EfficientNet','ResNet','UNet','Transfer learning'],lab:'Multi-scale patches'},
  {t:'Explainability',h:'Show clinicians where the model looked.',d:'Attach visual and feature-level explanations to every prediction, so a reviewer can check the evidence instead of trusting a score.',pk:'In practice · MSc thesis, IEEE iAims 2026',p:'Grad-CAM maps overlaid on fundus images highlight the lesions that drove each retinopathy grade.',tools:['Grad-CAM','Saliency maps','SHAP','LIME','Feature attribution'],lab:'Grad-CAM attention'},
  {t:'Evidence',h:'Separate cause from correlation.',d:'Ask why, not only what. Causal methods test which factors drive an outcome and report effects together with their uncertainty.',pk:'In practice · Retinopathy of prematurity',p:'Multimodal modelling with causal-mediation analysis of what drives retinal vascular severity.',tools:['Causal inference','Mediation analysis','Multimodal ML','Uncertainty'],lab:'Causal pathway'},
  {t:'Deployment',h:'Ship it where it can be checked.',d:'Version data and experiments, package models reproducibly, and route uncertain cases to a human reviewer instead of forcing an answer.',pk:'In practice · Lung tumour segmentation',p:'An automated CT pipeline that delineates tumour boundaries to support early oncology diagnosis.',tools:['MLflow','DVC','Docker','IBM Cloud','Power BI'],lab:'Monitored in use'}
];
if(!document.getElementById('pipe-viz'))return;
const tabs=[...document.querySelectorAll('.pipe-tab')],viz=$('#pipe-viz'),body=$('#pipe-body'),fill=$('#pipe-fill');
let si=0;
function fill_(i){const s=stages[i];$('#st-n').textContent=String(i+1).padStart(2,'0');$('#st-h').textContent=s.h;$('#st-d').textContent=s.d;$('#st-pk').textContent=s.pk;$('#st-p').textContent=s.p;$('#st-t').innerHTML=s.tools.map(t=>'<span class="tech-pill">'+t+'</span>').join('');$('#viz-label').textContent=s.lab;body.setAttribute('aria-labelledby','ptab-'+i)}
function show(i,animate){
    si=i;tabs.forEach((t,j)=>{t.setAttribute('aria-selected',String(j===i));t.tabIndex=j===i?0:-1});
    viz.dataset.stage=String(i+1);fill.style.width=((i+1)/6*100)+'%';
    if(animate&&!rm.matches){body.classList.add('swap');setTimeout(()=>{fill_(i);body.classList.remove('swap')},180)}else fill_(i);
}
tabs.forEach((t,i)=>t.addEventListener('click',()=>show(i,true)));
$('.pipe-rail').addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowLeft:-1}[e.key];if(k){e.preventDefault();show((si+k+6)%6,true);tabs[si].focus()}});
$('#st-prev').addEventListener('click',()=>show((si+5)%6,true));
$('#st-next').addEventListener('click',()=>show((si+1)%6,true));
show(0,false);
})();
