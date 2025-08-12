// Pro v3 — modern UI + pro print
(function(){
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const KEY = 'greenleaf_itinerary_pro_v3';

  // SEA airports (expanded)
  const SEA_AIRPORTS = [
    "SINGAPORE (SIN)","KUALA LUMPUR (KUL)","PENANG (PEN)","LANGKAWI (LGK)","JOHOR BAHRU (JHB)","KOTA KINABALU (BKI)","KUCHING (KCH)",
    "BANGKOK SUVARNABHUMI (BKK)","BANGKOK DON MUEANG (DMK)","PHUKET (HKT)","CHIANG MAI (CNX)","CHIANG RAI (CEI)","KRABI (KBV)","HAT YAI (HDY)",
    "JAKARTA SOEKARNO-HATTA (CGK)","BALI DENPASAR (DPS)","SURABAYA (SUB)","YOGYAKARTA (YIA)","MEDAN KUALANAMU (KNO)","LOMBOK (LOP)","BATAM (BTH)",
    "HANOI (HAN)","HO CHI MINH (SGN)","DA NANG (DAD)","NHA TRANG CAM RANH (CXR)","PHU QUOC (PQC)","HUE (HUI)","HAI PHONG (HPH)","VINH (VII)","CAN THO (VCA)",
    "PHNOM PENH (PNH)","SIEM REAP (SAI)","SIHANOUKVILLE (KOS)",
    "VIENTIANE (VTE)","LUANG PRABANG (LPQ)","PAKSE (PKZ)",
    "YANGON (RGN)","MANDALAY (MDL)",
    "MANILA (MNL)","CLARK (CRK)","CEBU (CEB)","DAVAO (DVO)","ILOILO (ILO)","CAGAYAN DE ORO (CGY)",
    "BRUNEI (BWN)",
    "DILI (DIL)"
  ];

  const dl = $('#airports');
  SEA_AIRPORTS.forEach(a => { const o=document.createElement('option'); o.value=a; dl.appendChild(o); });

  // Watermark defaults
  const wmWrap = $('#watermarkWrap');
  wmWrap.dataset.wm = "";
  document.documentElement.style.setProperty('--wm-size', '96px');
  document.documentElement.style.setProperty('--wm-opacity', '0.05');
  document.documentElement.style.setProperty('--wm-rot', '-24deg');

  // Dynamic @page
  const printStyle = document.createElement('style');
  document.head.appendChild(printStyle);
  function setPrint(page='A4', margin='normal'){
    let mm; switch(margin){case'narrow':mm='8mm';break;case'wide':mm='18mm';break;default:mm='12mm'}
    printStyle.textContent = `@page{{ size:${page}; margin:${mm}; }}`.replace("{{","{").replace("}}","}");
  }

  // Signature previews
  function bindSignaturePreview(prefix){
    const nameEl = $(`[data-field="${prefix}Name"]`);
    const posEl  = $(`[data-field="${prefix}Pos"]`);
    const imgEl  = $(`[data-field="${prefix}Img"]`);
    const namePrev = $(`#${prefix}NamePreview`);
    const posPrev  = $(`#${prefix}PosPreview`);
    const imgPrev  = $(`#${prefix}Preview`);
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

  // Buttons / elements
  const pageSize   = $('#pageSize');
  const marginSize = $('#marginSize');
  const uppercase  = $('#uppercaseMode');
  const disclaimerToggle = $('#toggleDisclaimer');
  const disclaimerText   = $('#disclaimerText');
  const brandLogo = $('#brandLogo');
  const logoURL = $('#logoURL');
  $('#applyLogo')?.addEventListener('click', ()=>{ if(logoURL.value) brandLogo.src = logoURL.value; autosave(); });

  // Watermark controls
  const wmText = $('#wmText'); const wmToggle = $('#wmToggle');
  const wmOpacity = $('#wmOpacity'); const wmSize = $('#wmSize'); const wmAngle = $('#wmAngle');
  function applyWatermark(){
    wmWrap.dataset.wm = wmToggle?.checked ? (wmText?.value || '') : '';
    document.documentElement.style.setProperty('--wm-opacity', wmOpacity?.value || 0.05);
    document.documentElement.style.setProperty('--wm-size', (wmSize?.value || 96)+'px');
    document.documentElement.style.setProperty('--wm-rot', (wmAngle?.value || -24)+'deg');
  }
  ;[wmText, wmToggle, wmOpacity, wmSize, wmAngle].forEach(el => el && el.addEventListener('input', ()=>{ applyWatermark(); autosave(); }));

  // Tables
  const flightBody = $('#flightTable tbody');
  const visitBody  = $('#visitTable tbody');
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

  // Collect / Populate
  function collect(){
    return {
      head: {
        docTitle: 'OFFICIAL BUSINESS ITINERARY',
        tripTag:  $('[data-field="tripTag"]').innerText.trim(),
        brandName: $('[data-field="brandName"]').innerText.trim(),
        logo: brandLogo.src || ''
      },
      overview: {
        participants: $('[textarea][data-field="participants"]').value,
        phones:       $('[textarea][data-field="phones"]').value,
        purpose:      $('[data-field="purpose"]').value,
        factory:      $('[data-field="factory"]').value,
        startDate:    $('[data-field="startDate"]').value,
        endDate:      $('[data-field="endDate"]').value,
        hotel:        $('[data-field="hotel"]')?.value || '',
        map:          $('[data-field="map"]')?.value || '',
        hotelContacts:$('[data-field="hotelContacts"]')?.value || ''
      },
      flights: $$('#flightTable tbody tr').map(tr=>{
        const tds = $$('td', tr);
        return {
          flight: $('input', tds[0]).value,
          date:   $('input', tds[1]).value,
          from:   $('input', tds[2]).value,
          to:     $('input', tds[3]).value,
          dep:    $('input', tds[4]).value,
          arr:    $('input', tds[5]).value,
        };
      }),
      visits: $$('#visitTable tbody tr').map(tr=>{
        const tds = $$('td', tr);
        return {
          date: $('input', tds[0]).value,
          activity: $('input', tds[1]).value,
          facility: $('input', tds[2]).value,
          address: $('textarea', tds[3]).value,
          transport: $('select', tds[4]).value,
        };
      }),
      notes: {
        pickup:       $('[data-field="pickup"]').innerHTML,
        instructions: $('[data-field="instructions"]').innerHTML,
        payment:      $('[data-field="payment"]').innerHTML,
        contacts:     $('[data-field="contacts"]').innerHTML
      },
      footer: {
        showDisclaimer: $('#toggleDisclaimer')?.checked ?? true,
        disclaimer: $('#disclaimerText')?.value || ''
      },
      sig: {
        prepared: {
          name: $('[data-field="sigPreparedName"]')?.value || '',
          pos:  $('[data-field="sigPreparedPos"]')?.value || '',
          img:  $('[data-field="sigPreparedImg"]')?.value || '',
          date: $('[data-field="sigPreparedDate"]')?.value || ''
        },
        approved: {
          name: $('[data-field="sigApprovedName"]')?.value || '',
          pos:  $('[data-field="sigApprovedPos"]')?.value || '',
          img:  $('[data-field="sigApprovedImg"]')?.value || '',
          date: $('[data-field="sigApprovedDate"]')?.value || ''
        }
      },
      wm: {
        text: wmText?.value || '',
        on: wmToggle?.checked || false,
        opacity: wmOpacity?.value || 0.05,
        size: wmSize?.value || 96,
        angle: wmAngle?.value || -24
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
      $('[data-field="tripTag"]').innerText  = data.head?.tripTag  || 'SINGAPORE MANAGEMENT SUPPORT';
      $('[data-field="brandName"]').innerText= data.head?.brandName || 'Greenleaf Assurance';
      $('#brandNameFooter').textContent      = data.head?.brandName || 'Greenleaf Assurance';
      brandLogo.src = data.head?.logo || brandLogo.src;
      $('#logoURL') && ($('#logoURL').value = brandLogo.src);

      $('[textarea][data-field="participants"]').value = data.overview?.participants || '';
      $('[textarea][data-field="phones"]').value       = data.overview?.phones || '';
      $('[data-field="purpose"]').value                = data.overview?.purpose || '';
      $('[data-field="factory"]').value                = data.overview?.factory || '';
      $('[data-field="startDate"]').value              = data.overview?.startDate || '';
      $('[data-field="endDate"]').value                = data.overview?.endDate || '';
      $('[data-field="hotel"]').value                  = data.overview?.hotel || '';
      $('[data-field="map"]').value                    = data.overview?.map || '';
      $('[data-field="hotelContacts"]').value          = data.overview?.hotelContacts || '';

      const datesBind = document.querySelector('[data-bind="dates"]');
      if(datesBind){
        const s = $('[data-field="startDate"]').value;
        const e = $('[data-field="endDate"]').value;
        datesBind.textContent = (s && e) ? `${s} – ${e}` : '';
      }

      flightBody.innerHTML = '';
      (data.flights||[]).forEach(r=> flightBody.appendChild(flightRow(r)));
      visitBody.innerHTML  = '';
      (data.visits||[]).forEach(r=> visitBody.appendChild(visitRow(r)));
      ensureAtLeastOneRow();

      $('[data-field="pickup"]').innerHTML       = data.notes?.pickup || '';
      $('[data-field="instructions"]').innerHTML = data.notes?.instructions || '';
      $('[data-field="payment"]').innerHTML      = data.notes?.payment || '';
      $('[data-field="contacts"]').innerHTML     = data.notes?.contacts || '';

      ['sigPrepared','sigApproved'].forEach(p=>{
        const name = $('[data-field="'+p+'Name"]'); const pos = $('[data-field="'+p+'Pos"]'); const img = $('[data-field="'+p+'Img"]');
        $('#'+p+'NamePreview').textContent = name?.value || '';
        $('#'+p+'PosPreview').textContent  = pos?.value || '';
        const src = img?.value || ''; const tag = $('#'+p+'Preview'); tag.src = src; tag.style.display = src ? 'block':'none';
      });

      if($('#toggleDisclaimer')) $('#toggleDisclaimer').checked = !!data.footer?.showDisclaimer;
      if($('#disclaimerText') && data.footer?.disclaimer) $('#disclaimerText').value = data.footer.disclaimer;

      if($('#wmText')) $('#wmText').value = data.wm?.text || '';
      if($('#wmToggle')) $('#wmToggle').checked = !!data.wm?.on;
      if($('#wmOpacity')) $('#wmOpacity').value = data.wm?.opacity || 0.05;
      if($('#wmSize')) $('#wmSize').value    = data.wm?.size || 96;
      if($('#wmAngle')) $('#wmAngle').value   = data.wm?.angle || -24;
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
      if($('#uppercaseMode')?.checked && e.target.classList.contains('upper')){
        const s = e.target.selectionStart, t = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase(); try{ e.target.setSelectionRange(s,t);}catch{}
      }
      if(e.target.matches('[data-field="startDate"],[data-field="endDate"]')){
        const s = $('[data-field="startDate"]').value;
        const e2= $('[data-field="endDate"]').value;
        const datesBind = document.querySelector('[data-bind="dates"]');
        if(datesBind) datesBind.textContent = (s && e2) ? `${s} – ${e2}` : '';
      }
      autosave();
    }
  });

  // Actions
  $('#addFlight').addEventListener('click', ()=>{ flightBody.appendChild(flightRow()); autosave(); });
  $('#addVisit').addEventListener('click', ()=>{ visitBody.appendChild(visitRow()); autosave(); });
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.closest('.delRow')){ e.target.closest('tr').remove(); autosave(); }
  });

  // Save/Load/Reset
  $('#btnSave').addEventListener('click', ()=>{ autosave(); alert('Saved to this browser.'); });
  $('#btnLoad').addEventListener('click', ()=>{
    const raw = localStorage.getItem(KEY);
    if(!raw) return alert('No saved data found.');
    populate(JSON.parse(raw));
  });
  $('#btnReset').addEventListener('click', ()=>{ if(confirm('Clear saved data?')){ localStorage.removeItem(KEY); location.reload(); } });

  // New
  $('#btnNewBlank').addEventListener('click', ()=>{ if(confirm('Start a new blank itinerary?')){ populate(blankData()); autosave(); } });
  $('#btnNewTemplate').addEventListener('click', ()=>{ if(confirm('Load sample template data?')){ populate(templateData()); autosave(); } });

  // Export / Import (plain + encrypted)
  $('#btnExport').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(collect(), null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `greenleaf-itinerary-${Date.now()}.json`; a.click();
  });
  $('#btnExportEnc').addEventListener('click', async ()=>{
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
  $('#btnImport').addEventListener('click', ()=> $('#fileImport').click());
  $('#fileImport').addEventListener('change', (e)=>{
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

  // Crypto helpers
  function buf2b64(buf){ let binary=''; buf.forEach(b=> binary += String.fromCharCode(b)); return btoa(binary); }
  function b64tobuf(b64){ const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i); return arr.buffer; }
  async function deriveKey(password, salt){
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }

  // Print
  $('#btnPrint').addEventListener('click', ()=>{
    const sec = $('#disclaimerText')?.closest('.card');
    if(sec) sec.style.display = ($('#toggleDisclaimer')?.checked ?? true) ? '' : 'none';
    window.print();
  });

  // Prefs
  function applyPrefs(){
    setPrint($('#pageSize').value, $('#marginSize').value);
    const on = $('#uppercaseMode')?.checked;
    ['[data-field="participants"]','[data-field="sigPreparedName"]','[data-field="sigApprovedName"]'].forEach(sel=> $(sel)?.classList.toggle('uppercase', !!on));
    $$('#flightTable .upper, #visitTable .upper').forEach(el => { el.classList.toggle('uppercase', !!on); if(on) el.value = el.value.toUpperCase(); });
  }
  ;['pageSize','marginSize','uppercaseMode','toggleDisclaimer'].forEach(id=>{
    const el = document.getElementById(id); el && el.addEventListener('change', ()=>{ applyPrefs(); autosave(); });
  });

  function blankData(){
    return {
      head:{docTitle:'OFFICIAL BUSINESS ITINERARY', tripTag:'', brandName:'Greenleaf Assurance', logo: $('#brandLogo').src},
      overview:{participants:'', phones:'', purpose:'', factory:'', startDate:'', endDate:'', hotel:'', map:'', hotelContacts:''},
      flights:[], visits:[],
      notes:{pickup:'', instructions:'', payment:'', contacts:''},
      footer:{showDisclaimer:true, disclaimer: $('#disclaimerText').value},
      sig:{ prepared:{}, approved:{} },
      wm:{ text:'', on:false, opacity:0.05, size:96, angle:-24 },
      prefs:{pageSize:'A4', margin:'normal', uppercase:false}
    };
  }
  function templateData(){
    const plus = (n)=> new Date(Date.now()+n*86400000).toISOString().slice(0,10);
    return {
      head:{docTitle:'OFFICIAL BUSINESS ITINERARY', tripTag:'SINGAPORE MANAGEMENT SUPPORT', brandName:'Greenleaf Assurance', logo: $('#brandLogo').src},
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
      footer:{showDisclaimer:true, disclaimer: $('#disclaimerText').value},
      sig:{
        prepared:{ name:'JANE DOE', pos:'HEAD OF COMPLIANCE', img:'', date: plus(0) },
        approved:{ name:'JOHN LEE', pos:'DIRECTOR', img:'', date: plus(0) }
      },
      wm:{ text:'GREENLEAF — CONFIDENTIAL', on:true, opacity:0.05, size:96, angle:-24 },
      prefs:{pageSize:'A4', margin:'normal', uppercase:true}
    };
  }

  // Init
  $('#year').textContent = new Date().getFullYear();
  setPrint('A4','normal');
  const saved = localStorage.getItem(KEY);
  if(saved){ try{ populate(JSON.parse(saved)); }catch{ populate(templateData()); } }
  else{ populate(templateData()); }

})();