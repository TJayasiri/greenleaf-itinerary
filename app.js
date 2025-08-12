(function(){
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const KEY = 'greenleaf_itinerary_pro_v3_1';

  const SEA_AIRPORTS = [
    "SINGAPORE (SIN)","KUALA LUMPUR (KUL)","PENANG (PEN)","LANGKAWI (LGK)","JOHOR BAHRU (JHB)","KOTA KINABALU (BKI)","KUCHING (KCH)",
    "BANGKOK SUVARNABHUMI (BKK)","BANGKOK DON MUEANG (DMK)","PHUKET (HKT)","CHIANG MAI (CNX)","CHIANG RAI (CEI)","KRABI (KBV)","HAT YAI (HDY)",
    "JAKARTA SOEKARNO-HATTA (CGK)","BALI DENPASAR (DPS)","SURABAYA (SUB)","YOGYAKARTA (YIA)","MEDAN KUALANAMU (KNO)","LOMBOK (LOP)","BATAM (BTH)",
    "HANOI (HAN)","HO CHI MINH (SGN)","DA NANG (DAD)","NHA TRANG CAM RANH (CXR)","PHU QUOC (PQC)","HUE (HUI)","HAI PHONG (HPH)","VINH (VII)","CAN THO (VCA)",
    "PHNOM PENH (PNH)","SIEM REAP (SAI)","SIHANOUKVILLE (KOS)",
    "VIENTIANE (VTE)","LUANG PRABANG (LPQ)","PAKSE (PKZ)",
    "YANGON (RGN)","MANDALAY (MDL)",
    "MANILA (MNL)","CLARK (CRK)","CEBU (CEB)","DAVAO (DVO)","ILOILO (ILO)","CAGAYAN DE ORO (CGY)",
    "BRUNEI (BWN)","DILI (DIL)"
  ];

  const dl = document.getElementById('airports');
  SEA_AIRPORTS.forEach(a => { const o=document.createElement('option'); o.value=a; dl.appendChild(o); });

  const wmWrap = document.getElementById('watermarkWrap');
  wmWrap.dataset.wm = "";
  document.documentElement.style.setProperty('--wm-size', '96px');
  document.documentElement.style.setProperty('--wm-opacity', '0.05');
  document.documentElement.style.setProperty('--wm-rot', '-24deg');

  const printStyle = document.createElement('style');
  document.head.appendChild(printStyle);
  function setPrint(page='A4', margin='normal'){
    let mm; switch(margin){case'narrow':mm='8mm';break;case'wide':mm='18mm';break;default:mm='10mm'}
    printStyle.textContent = `@page{ size:${page}; margin:${mm}; }`;
  }

  function bindSignaturePreview(prefix){
    const nameEl = document.querySelector(`[data-field="${prefix}Name"]`);
    const posEl  = document.querySelector(`[data-field="${prefix}Pos"]`);
    const imgEl  = document.querySelector(`[data-field="${prefix}Img"]`);
    const namePrev = document.getElementById(`${prefix}NamePreview`);
    const posPrev  = document.getElementById(`${prefix}PosPreview`);
    const imgPrev  = document.getElementById(`${prefix}Preview`);
    function sync(){
      if(namePrev) namePrev.textContent = nameEl?.value || "";
      if(posPrev)  posPrev.textContent  = posEl?.value || "";
      if(imgPrev){ imgPrev.src = imgEl?.value || ""; imgPrev.style.display = (imgEl?.value ? "block":"none"); }
    }
    [nameEl,posEl,imgEl].forEach(el=> el && el.addEventListener('input', ()=>{ sync(); autosave(); }));
    sync();
  }
  bindSignaturePreview('sigPrepared');
  bindSignaturePreview('sigApproved');

  document.getElementById('year').textContent = new Date().getFullYear();
  const brandLogo = document.getElementById('brandLogo');
  const logoURL = document.getElementById('logoURL');
  document.getElementById('applyLogo')?.addEventListener('click', ()=>{ if(logoURL.value) brandLogo.src = logoURL.value; autosave(); });

  const wmText = document.getElementById('wmText'); const wmToggle = document.getElementById('wmToggle');
  const wmOpacity = document.getElementById('wmOpacity'); const wmSize = document.getElementById('wmSize'); const wmAngle = document.getElementById('wmAngle');
  function applyWatermark(){
    wmWrap.dataset.wm = wmToggle?.checked ? (wmText?.value || '') : '';
    document.documentElement.style.setProperty('--wm-opacity', wmOpacity?.value || 0.05);
    document.documentElement.style.setProperty('--wm-size', (wmSize?.value || 96)+'px');
    document.documentElement.style.setProperty('--wm-rot', (wmAngle?.value || -24)+'deg');
  }
  [wmText, wmToggle, wmOpacity, wmSize, wmAngle].forEach(el => el && el.addEventListener('input', ()=>{ applyWatermark(); autosave(); }));

  const pageSize   = document.getElementById('pageSize');
  const marginSize = document.getElementById('marginSize');
  const uppercase  = document.getElementById('uppercaseMode');
  const disclaimerToggle = document.getElementById('toggleDisclaimer');
  const disclaimerText   = document.getElementById('disclaimerText');

  const flightBody = document.querySelector('#flightTable tbody');
  const visitBody  = document.querySelector('#visitTable tbody');

  function escapeVal(v){ return (v||'').toString().replace(/"/g,'&quot;'); }
  function flightRow(data={}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="upper flight" placeholder="Flight No." value="${escapeVal(data.flight)}"></td>
      <td><input type="date" value="${escapeVal(data.date)}"></td>
      <td><input list="airports" class="upper" placeholder="From (City – IATA)" value="${escapeVal(data.from)}"></td>
      <td><input list="airports" class="upper" placeholder="To (City – IATA)" value="${escapeVal(data.to)}"></td>
      <td><input type="time" value="${escapeVal(data.dep)}"></td>
      <td><input type="time" value="${escapeVal(data.arr)}"></td>
      <td class="row-actions"><button class="btn small ghost delRow"><svg><use href="#i-trash"/></svg></button></td>
    `;
    return tr;
  }
  function visitRow(data={}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="date" value="${escapeVal(data.date)}"></td>
      <td><input placeholder="Activity" value="${escapeVal(data.activity)}"></td>
      <td><input class="upper" placeholder="Facility" value="${escapeVal(data.facility)}"></td>
      <td><textarea placeholder="Full site address">${escapeVal(data.address)}</textarea></td>
      <td>
        <select>
          ${['','Car','Grab','Taxi','MRT','Bus','MRT+Bus','Company van','Walk'].map(x=>`<option ${data.transport===x?'selected':''}>${x}</option>`).join('')}
        </select>
      </td>
      <td class="row-actions"><button class="btn small ghost delRow"><svg><use href="#i-trash"/></svg></button></td>
    `;
    return tr;
  }
  function ensureAtLeastOneRow(){
    if(!flightBody.children.length) flightBody.appendChild(flightRow());
    if(!visitBody.children.length)  visitBody.appendChild(visitRow());
  }

  function collect(){
    return {
      head: {
        docTitle: 'OFFICIAL BUSINESS ITINERARY',
        tripTag:  document.querySelector('[data-field="tripTag"]').innerText.trim(),
        brandName: document.querySelector('[data-field="brandName"]').innerText.trim(),
        logo: brandLogo.src || ''
      },
      overview: {
        participants: document.querySelector('[textarea][data-field="participants"]').value,
        phones:       document.querySelector('[textarea][data-field="phones"]').value,
        purpose:      document.querySelector('[data-field="purpose"]')?.value || '',
        factory:      document.querySelector('[data-field="factory"]')?.value || '',
        startDate:    document.querySelector('[data-field="startDate"]').value,
        endDate:      document.querySelector('[data-field="endDate"]').value,
        hotel:        document.querySelector('[data-field="hotel"]')?.value || '',
        map:          document.querySelector('[data-field="map"]')?.value || '',
        hotelContacts:document.querySelector('[data-field="hotelContacts"]')?.value || ''
      },
      flights: Array.from(document.querySelectorAll('#flightTable tbody tr')).map(tr=>{
        const tds = tr.querySelectorAll('td');
        return {
          flight: tds[0].querySelector('input').value,
          date:   tds[1].querySelector('input').value,
          from:   tds[2].querySelector('input').value,
          to:     tds[3].querySelector('input').value,
          dep:    tds[4].querySelector('input').value,
          arr:    tds[5].querySelector('input').value,
        };
      }),
      visits: Array.from(document.querySelectorAll('#visitTable tbody tr')).map(tr=>{
        const tds = tr.querySelectorAll('td');
        return {
          date: tds[0].querySelector('input').value,
          activity: tds[1].querySelector('input').value,
          facility: tds[2].querySelector('input').value,
          address: tds[3].querySelector('textarea').value,
          transport: tds[4].querySelector('select').value,
        };
      }),
      notes: {
        pickup:       document.querySelector('[data-field="pickup"]').innerHTML,
        instructions: document.querySelector('[data-field="instructions"]').innerHTML,
        payment:      document.querySelector('[data-field="payment"]').innerHTML,
        contacts:     document.querySelector('[data-field="contacts"]').innerHTML
      },
      footer: {
        showDisclaimer: disclaimerToggle?.checked ?? true,
        disclaimer: disclaimerText?.value || ''
      },
      sig: {
        prepared: {
          name: document.querySelector('[data-field="sigPreparedName"]')?.value || '',
          pos:  document.querySelector('[data-field="sigPreparedPos"]')?.value || '',
          img:  document.querySelector('[data-field="sigPreparedImg"]')?.value || '',
          date: document.querySelector('[data-field="sigPreparedDate"]')?.value || ''
        },
        approved: {
          name: document.querySelector('[data-field="sigApprovedName"]')?.value || '',
          pos:  document.querySelector('[data-field="sigApprovedPos"]')?.value || '',
          img:  document.querySelector('[data-field="sigApprovedImg"]')?.value || '',
          date: document.querySelector('[data-field="sigApprovedDate"]')?.value || ''
        }
      },
      wm: {
        text: document.getElementById('wmText')?.value || '',
        on: document.getElementById('wmToggle')?.checked || false,
        opacity: document.getElementById('wmOpacity')?.value || 0.05,
        size: document.getElementById('wmSize')?.value || 96,
        angle: document.getElementById('wmAngle')?.value || -24
      },
      prefs: {
        pageSize: pageSize.value,
        margin: marginSize.value,
        uppercase: uppercase?.checked || false
      }
    };
  }

  function populate(data){
    try{
      document.querySelector('[data-field="tripTag"]').innerText  = data.head?.tripTag  || 'SINGAPORE MANAGEMENT SUPPORT';
      document.querySelector('[data-field="brandName"]').innerText= data.head?.brandName || 'Greenleaf Assurance';
      document.getElementById('brandNameFooter').textContent      = data.head?.brandName || 'Greenleaf Assurance';
      brandLogo.src = data.head?.logo || brandLogo.src;
      document.getElementById('logoURL') && (document.getElementById('logoURL').value = brandLogo.src);

      document.querySelector('[textarea][data-field="participants"]').value = data.overview?.participants || '';
      document.querySelector('[textarea][data-field="phones"]').value       = data.overview?.phones || '';
      document.querySelector('[data-field="purpose"]') && (document.querySelector('[data-field="purpose"]').value = data.overview?.purpose || '');
      document.querySelector('[data-field="factory"]') && (document.querySelector('[data-field="factory"]').value = data.overview?.factory || '');
      document.querySelector('[data-field="startDate"]').value              = data.overview?.startDate || '';
      document.querySelector('[data-field="endDate"]').value                = data.overview?.endDate || '';
      document.querySelector('[data-field="hotel"]') && (document.querySelector('[data-field="hotel"]').value = data.overview?.hotel || '');
      document.querySelector('[data-field="map"]') && (document.querySelector('[data-field="map"]').value = data.overview?.map || '');
      document.querySelector('[data-field="hotelContacts"]') && (document.querySelector('[data-field="hotelContacts"]').value = data.overview?.hotelContacts || '');

      const datesBind = document.querySelector('[data-bind="dates"]');
      if(datesBind){
        const s = document.querySelector('[data-field="startDate"]').value;
        const e = document.querySelector('[data-field="endDate"]').value;
        datesBind.textContent = (s && e) ? `${s} – ${e}` : '';
      }

      flightBody.innerHTML = '';
      (data.flights||[]).forEach(r=> flightBody.appendChild(flightRow(r)));
      visitBody.innerHTML  = '';
      (data.visits||[]).forEach(r=> visitBody.appendChild(visitRow(r)));
      ensureAtLeastOneRow();

      document.querySelector('[data-field="pickup"]').innerHTML       = data.notes?.pickup || '';
      document.querySelector('[data-field="instructions"]').innerHTML = data.notes?.instructions || '';
      document.querySelector('[data-field="payment"]').innerHTML      = data.notes?.payment || '';
      document.querySelector('[data-field="contacts"]').innerHTML     = data.notes?.contacts || '';

      ['sigPrepared','sigApproved'].forEach(p=>{
        const name = document.querySelector('[data-field="'+p+'Name"]'); const pos = document.querySelector('[data-field="'+p+'Pos"]'); const img = document.querySelector('[data-field="'+p+'Img"]');
        document.getElementById(p+'NamePreview').textContent = name?.value || '';
        document.getElementById(p+'PosPreview').textContent  = pos?.value || '';
        const src = img?.value || ''; const tag = document.getElementById(p+'Preview'); tag.src = src; tag.style.display = src ? 'block':'none';
      });

      if(disclaimerToggle) disclaimerToggle.checked = !!data.footer?.showDisclaimer;
      if(disclaimerText && data.footer?.disclaimer) disclaimerText.value = data.footer.disclaimer;

      document.getElementById('wmText') && (document.getElementById('wmText').value = data.wm?.text || '');
      document.getElementById('wmToggle') && (document.getElementById('wmToggle').checked = !!data.wm?.on);
      document.getElementById('wmOpacity') && (document.getElementById('wmOpacity').value = data.wm?.opacity || 0.05);
      document.getElementById('wmSize')    && (document.getElementById('wmSize').value    = data.wm?.size || 96);
      document.getElementById('wmAngle')   && (document.getElementById('wmAngle').value   = data.wm?.angle || -24);
      applyWatermark();

      pageSize.value = data.prefs?.pageSize || 'A4';
      marginSize.value = data.prefs?.margin || 'normal';
      uppercase.checked = !!data.prefs?.uppercase;
      applyPrefs();
    }catch(e){ console.error('populate', e); }
  }

  function autosave(){ localStorage.setItem(KEY, JSON.stringify(collect())); }
  document.addEventListener('input', (e)=>{
    if(e.target.matches('input, textarea, select,[contenteditable]')){
      if(document.getElementById('uppercaseMode')?.checked && e.target.classList.contains('upper')){
        const s = e.target.selectionStart, t = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase(); try{ e.target.setSelectionRange(s,t);}catch{}
      }
      if(e.target.matches('[data-field="startDate"],[data-field="endDate"]')){
        const s = document.querySelector('[data-field="startDate"]').value;
        const e2= document.querySelector('[data-field="endDate"]').value;
        const datesBind = document.querySelector('[data-bind="dates"]');
        if(datesBind) datesBind.textContent = (s && e2) ? `${s} – ${e2}` : '';
      }
      autosave();
    }
  });

  document.getElementById('addFlight').addEventListener('click', ()=>{ flightBody.appendChild(flightRow()); autosave(); });
  document.getElementById('addVisit').addEventListener('click', ()=>{ visitBody.appendChild(visitRow()); autosave(); });
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.closest('.delRow')){ e.target.closest('tr').remove(); autosave(); }
  });

  document.getElementById('btnSave').addEventListener('click', ()=>{ autosave(); alert('Saved to this browser.'); });
  document.getElementById('btnLoad').addEventListener('click', ()=>{
    const raw = localStorage.getItem(KEY);
    if(!raw) return alert('No saved data found.');
    populate(JSON.parse(raw));
  });
  document.getElementById('btnReset').addEventListener('click', ()=>{ if(confirm('Clear saved data?')){ localStorage.removeItem(KEY); location.reload(); } });

  document.getElementById('btnNewBlank').addEventListener('click', ()=>{ if(confirm('Start a new blank itinerary?')){ populate(blankData()); autosave(); } });
  document.getElementById('btnNewTemplate').addEventListener('click', ()=>{ if(confirm('Load sample template data?')){ populate(templateData()); autosave(); } });

  document.getElementById('btnExport').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(collect(), null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `greenleaf-itinerary-${Date.now()}.json`; a.click();
  });
  document.getElementById('btnExportEnc').addEventListener('click', async ()=>{
    const pwd = prompt('Set a password for this file:');
    if(!pwd) return;
    const data = new TextEncoder().encode(JSON.stringify(collect()));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(pwd, salt);
    const ct   = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
    const out = { v:1, alg:'AES-GCM', kdf:'PBKDF2', salt: buf2b64(salt), iv: buf2b64(iv), ct: buf2b64(new Uint8Array(ct)) };
    const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/octet-stream'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `greenleaf-itinerary-${Date.now()}.gleaf`; a.click();
  });
  document.getElementById('btnImport').addEventListener('click', ()=> document.getElementById('fileImport').click());
  document.getElementById('fileImport').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try{
        const txt = reader.result; let obj = JSON.parse(txt);
        if(obj && obj.ct && obj.iv && obj.salt){
          const pwd = prompt('Enter password to decrypt:'); if(!pwd) return;
          const key = await deriveKey(pwd, b64tobuf(obj.salt));
          const pt  = await crypto.subtle.decrypt({name:'AES-GCM', iv: b64tobuf(obj.iv)}, key, b64tobuf(obj.ct));
          obj = JSON.parse(new TextDecoder().decode(new Uint8Array(pt)));
        }
        populate(obj); autosave(); alert('Imported.');
      }catch(err){ alert('Invalid or corrupted file.'); console.error(err); }
      finally{ e.target.value = ''; }
    };
    reader.readAsText(file);
  });

  function buf2b64(buf){ let binary=''; buf.forEach(b=> binary += String.fromCharCode(b)); return btoa(binary); }
  function b64tobuf(b64){ const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i); return arr.buffer; }
  async function deriveKey(password, salt){
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }

  document.getElementById('btnPrint').addEventListener('click', ()=>{
    const sec = document.getElementById('disclaimerText')?.closest('.card');
    if(sec) sec.style.display = (document.getElementById('toggleDisclaimer')?.checked ?? true) ? '' : 'none';
    window.print();
  });

  function applyPrefs(){
    setPrint(document.getElementById('pageSize').value, document.getElementById('marginSize').value);
    const on = document.getElementById('uppercaseMode')?.checked;
    ['[data-field="participants"]','[data-field="sigPreparedName"]','[data-field="sigApprovedName"]'].forEach(sel=> document.querySelector(sel)?.classList.toggle('uppercase', !!on));
    document.querySelectorAll('#flightTable .upper, #visitTable .upper').forEach(el => { el.classList.toggle('uppercase', !!on); if(on) el.value = el.value.toUpperCase(); });
  }
  ;['pageSize','marginSize','uppercaseMode','toggleDisclaimer'].forEach(id=>{
    const el = document.getElementById(id); el && el.addEventListener('change', ()=>{ applyPrefs(); autosave(); });
  });

  function plus(n){ return new Date(Date.now()+n*86400000).toISOString().slice(0,10); }
  function blankData(){
    return {
      head:{docTitle:'OFFICIAL BUSINESS ITINERARY', tripTag:'', brandName:'Greenleaf Assurance', logo: document.getElementById('brandLogo').src},
      overview:{participants:'', phones:'', purpose:'', factory:'', startDate:'', endDate:'', hotel:'', map:'', hotelContacts:''},
      flights:[], visits:[],
      notes:{pickup:'', instructions:'', payment:'', contacts:''},
      footer:{showDisclaimer:true, disclaimer: document.getElementById('disclaimerText').value},
      sig:{ prepared:{}, approved:{} },
      wm:{ text:'', on:false, opacity:0.05, size:96, angle:-24 },
      prefs:{pageSize:'A4', margin:'normal', uppercase:false}
    };
  }
  function templateData(){
    return {
      head:{docTitle:'OFFICIAL BUSINESS ITINERARY', tripTag:'SINGAPORE MANAGEMENT SUPPORT', brandName:'Greenleaf Assurance', logo: document.getElementById('brandLogo').src},
      overview:{
        participants:'JANE DOE; JOHN LEE',
        phones:'+65 8000 0000 | +65 8111 1111',
        purpose:'BUSINESS SUPPORT SERVICES',
        factory:'RIGHTMEN SECURITY / MARKONO PRINT MEDIA',
        startDate: plus(0), endDate: plus(2),
        hotel:'ibis Styles Singapore on MacPherson', map:'https://maps.google.com', hotelContacts:'Front desk +65 1234 5678'
      },
      flights:[
        {flight:'EK349', date:plus(-1), from:'PHNOM PENH (PNH)', to:'SINGAPORE (SIN)', dep:'20:50', arr:'23:50'},
        {flight:'EK349', date:plus(3),  from:'SINGAPORE (SIN)', to:'PHNOM PENH (PNH)', dep:'15:35', arr:'18:35'}
      ],
      visits:[
        {date:plus(1), activity:'SUPPORT', facility:'RIGHTMEN SECURITY SERVICES PTE LTD', address:'10 Anson Rd, International Plaza, #34-02, 079903', transport:'MRT+Bus'},
        {date:plus(2), activity:'SUPPORT', facility:'MARKONO PRINT MEDIA PTE LTD', address:'M-Cube, 18 Pioneer Crescent, 628567', transport:'Bus'}
      ],
      notes:{
        pickup:'Airport pickup via Grab. Use Terminal 1 gates.',
        instructions:'Arrive 08:45–09:00. Bring CAP evidence; ensure policy documents are ready.',
        payment:'Project fee and per diem as agreed. Settlement within 14 days after assignment.',
        contacts:'HQ: Niwanka Peries (niwankap@greenleafassurance.com). Local: Nalaka Wijayantha / Puyi Yang.'
      },
      footer:{showDisclaimer:true, disclaimer: document.getElementById('disclaimerText').value},
      sig:{
        prepared:{ name:'JANE DOE', pos:'HEAD OF COMPLIANCE', img:'', date: plus(0) },
        approved:{ name:'JOHN LEE', pos:'DIRECTOR', img:'', date: plus(0) }
      },
      wm:{ text:'GREENLEAF — CONFIDENTIAL', on:true, opacity:0.05, size:96, angle:-24 },
      prefs:{pageSize:'A4', margin:'normal', uppercase:true}
    };
  }

  setPrint('A4','normal');
  const saved = localStorage.getItem(KEY);
  if(saved){ try{ populate(JSON.parse(saved)); }catch{ populate(templateData()); } }
  else{ populate(templateData()); }
})();