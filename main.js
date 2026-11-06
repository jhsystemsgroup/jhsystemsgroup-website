(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav ---------- */
  const nav = $(".nav");
  const burger = $(".burger");
  if (burger) burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$(".has-menu > button").forEach(btn => btn.addEventListener("click", () => {
    const li = btn.parentElement;
    const open = li.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  }));
  document.addEventListener("click", e => {
    $$(".has-menu.open").forEach(li => { if (!li.contains(e.target)) { li.classList.remove("open"); $("button", li).setAttribute("aria-expanded", "false"); } });
  });
  $$(".nav-links a").forEach(a => a.addEventListener("click", () => nav && nav.classList.remove("open")));

  /* ---------- reminder demo ---------- */
  const demo = $("#demo");
  if (demo) {
    const scenarios = {
      mom: { address: "418 Maple Ave, Springfield", label: "Mom's birthday", who: "Mom", whoName: "Linda", occasion: "Birthday", msg: "Hi Mark! Your mom's birthday is in 2 days 🌷 Want us to put together something she'll love? Pickup or delivery?", note: "Loves tulips and anything yellow. No lilies." },
      anniv: { address: "1290 Oak Ridge Dr, Springfield", label: "Anniversary", who: "Wife", whoName: "Sarah", occasion: "Anniversary", msg: "Hi Mark! Your anniversary with Sarah is in 2 days 💐 Want flowers ready for pickup or delivered to her?", note: "Her favorite is garden roses, soft pinks." },
      vday: { address: "77 Willow Ln, Apt 4B, Springfield", label: "Valentine's Day", who: "Girlfriend", whoName: "Emma", occasion: "Valentine's Day", msg: "Hi Mark! Valentine's Day is in 2 days ❤️ Beat the rush and lock in Emma's flowers now. Pickup or delivery?", note: "Red roses, keep it classic." },
      mday: { address: "418 Maple Ave, Springfield", label: "Mother's Day", who: "Mom", whoName: "Linda", occasion: "Mother's Day", msg: "Hi Mark! Mother's Day is this Sunday 🌸 Want us to make something special for your mom? Pickup or delivery?", note: "Bright spring colors, no lilies." }
    };
    const thread = $(".thread", demo), chips = $$(".chip", demo), replies = $$(".replies button", demo), ticket = $(".ticket", demo);
    let current = "mom", timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, reduce ? 0 : ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const bubble = (text, cls) => { const b = document.createElement("div"); b.className = "bubble " + cls; b.textContent = text; thread.appendChild(b); thread.scrollTop = thread.scrollHeight; return b; };
    const typing = () => { const t = document.createElement("div"); t.className = "bubble in typing"; t.innerHTML = "<i></i><i></i><i></i>"; thread.appendChild(t); thread.scrollTop = thread.scrollHeight; return t; };
    const dateIn2 = () => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };

    function start(key) {
      clear(); current = key; const s = scenarios[key];
      chips.forEach(c => c.setAttribute("aria-pressed", c.dataset.key === key));
      ticket.classList.remove("show");
      thread.innerHTML = '<div class="stamp">Today 9:00 AM · automatic reminder</div>';
      replies.forEach(r => r.disabled = true);
      const t = typing();
      later(() => { t.remove(); bubble(s.msg, "in"); replies.forEach(r => r.disabled = false); }, 900);
    }
    function answer(kind) {
      const s = scenarios[current];
      demo.classList.add("tried");
      replies.forEach(r => r.disabled = true);
      if (kind === "skip") {
        bubble("Not this time, thanks!", "out");
        const t = typing();
        later(() => { t.remove(); bubble("No problem! We'll check in before the next one 🌿", "in"); }, 900);
        return;
      }
      bubble(kind === "delivery" ? "Delivery please!" : "I'll pick them up", "out");
      const t = typing();
      later(() => {
        t.remove();
        bubble(kind === "delivery"
          ? `Perfect. We'll deliver to ${s.whoName} on ${dateIn2()}. Here's your secure link to choose a bouquet and pay.`
          : `Perfect. They'll be ready for you on ${dateIn2()}. Here's your secure link to choose a bouquet and pay.`, "in");
        $("[data-f=customer]", ticket).textContent = "Mark Ellis";
        $("[data-f=for]", ticket).textContent = `${s.whoName} (${s.who})`;
        $("[data-f=occ]", ticket).textContent = s.occasion;
        $("[data-f=date]", ticket).textContent = dateIn2();
        $("[data-f=type]", ticket).textContent = kind === "delivery" ? "Delivery" : "Pickup";
        $("[data-f=addr]", ticket).textContent = s.address;
        $$(".addr", ticket).forEach(el => el.hidden = kind !== "delivery");
        $(".note", ticket).textContent = "“" + s.note + "”";
        later(() => ticket.classList.add("show"), 450);
      }, 1100);
    }
    chips.forEach(c => c.addEventListener("click", () => start(c.dataset.key)));
    replies.forEach(r => r.addEventListener("click", () => answer(r.dataset.kind)));
    $(".reset", demo).addEventListener("click", () => start(current));
    start("mom");
  }

  /* ---------- revenue calculator ---------- */
  const calc = $("#calc");
  if (calc) {
    const ins = $$("input[type=range]", calc);
    const fmt = n => "$" + Math.round(n).toLocaleString("en-US");
    const bars = $(".bars", calc);
    bars.innerHTML = Array.from({ length: 12 }, () => "<div></div>").join("");
    const weights = [0.6, 1.6, 0.8, 0.9, 1.5, 0.9, 0.7, 0.7, 0.8, 0.8, 0.8, 1.2]; // rough seasonal shape for illustration
    function run() {
      const v = Object.fromEntries(ins.map(i => [i.name, +i.value]));
      $("output[for=customers]", calc).textContent = v.customers;
      $("output[for=dates]", calc).textContent = v.dates;
      $("output[for=aov]", calc).textContent = fmt(v.aov);
      const orders = v.customers * v.dates; // every reminder counted as an order
      const total = orders * v.aov;
      $("#total", calc).textContent = fmt(total);
      $("#orders", calc).textContent = Math.round(orders).toLocaleString("en-US");
      const sum = weights.reduce((a, b) => a + b, 0), max = Math.max(...weights);
      $$("div", bars).forEach((b, i) => b.style.height = Math.max(6, (weights[i] / max) * 100 * Math.min(1, total / 8000 + .25)) + "%");
    }
    ins.forEach(i => i.addEventListener("input", run)); run();
  }

  /* ---------- year of occasions ---------- */
  const year = $("#year");
  if (year) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const data = [
      ["New Year's centerpieces"],
      ["Valentine's Day, the biggest flower day of the year"],
      ["International Women's Day", "St. Patrick's Day"],
      ["Easter", "Administrative Professionals Day"],
      ["Mother's Day", "Graduations", "Teacher Appreciation Week"],
      ["Father's Day", "Weddings and graduations"],
      ["Summer get-togethers"],
      ["Back to school", "Summer weddings"],
      ["Grandparents Day", "Fall weddings"],
      ["Sweetest Day", "Boss's Day"],
      ["Thanksgiving centerpieces"],
      ["Christmas and holiday parties", "Hanukkah"]
    ];
    const personal = ["Birthdays", "Anniversaries"];
    const grid = $(".year", year), detail = $(".month-detail", year);
    grid.innerHTML = months.map((m, i) => `<button class="month" type="button" aria-pressed="false" data-i="${i}">${m}<i>${data[i].map(() => "<b></b>").join("")}<b class="p"></b></i></button>`).join("");
    function show(i) {
      $$(".month", grid).forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
      detail.innerHTML = `<div><h3>${full[i]}</h3></div><ul>${data[i].map(d => `<li>${d}</li>`).join("")}${personal.map(p => `<li class="p">Your customers' ${p.toLowerCase()} this month</li>`).join("")}</ul>`;
    }
    grid.addEventListener("click", e => { const b = e.target.closest(".month"); if (b) show(+b.dataset.i); });
    show(new Date().getMonth());
  }

  /* ---------- scheduler ---------- */
  const sched = $("#scheduler");
  if (sched) {
    const daysEl = $(".days", sched), slotsEl = $(".slots", sched), picked = $(".picked", sched), when = $("input[name=when]", sched);
    const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
    const days = []; const d = new Date(); d.setHours(0, 0, 0, 0);
    while (days.length < 10) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d)); }
    let day = null, time = null;
    daysEl.innerHTML = days.map((x, i) => `<button type="button" class="day" data-i="${i}" aria-pressed="false"><span>${x.toLocaleDateString("en-US", { weekday: "short" })}</span><b>${x.getDate()}</b><span>${x.toLocaleDateString("en-US", { month: "short" })}</span></button>`).join("");
    slotsEl.innerHTML = times.map(t => `<button type="button" class="slot" data-t="${t}" aria-pressed="false" disabled>${t}</button>`).join("");
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "); } catch (e) {}
    $(".tz", sched).textContent = tz ? `Times shown in your time zone (${tz}).` : "";
    function update() {
      $$(".day", daysEl).forEach(b => b.setAttribute("aria-pressed", day !== null && +b.dataset.i === day));
      $$(".slot", slotsEl).forEach(b => { b.disabled = day === null; b.setAttribute("aria-pressed", b.dataset.t === time); });
      if (day !== null && time) {
        const label = days[day].toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " at " + time;
        picked.textContent = label; picked.classList.add("on"); when.value = label + (tz ? ` (${tz})` : "");
      } else if (day !== null) { picked.textContent = "Now choose a time"; picked.classList.remove("on"); }
    }
    daysEl.addEventListener("click", e => { const b = e.target.closest(".day"); if (b) { day = +b.dataset.i; update(); } });
    slotsEl.addEventListener("click", e => { const b = e.target.closest(".slot"); if (b && !b.disabled) { time = b.dataset.t; update(); } });
  }

  /* ---------- contact form ---------- */
  const form = $("#contact-form");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Requested time: ${d.get("when") || "Any time that works"}\nName: ${d.get("name")}\nBusiness: ${d.get("business")}\nEmail: ${d.get("email")}\nPhone: ${d.get("phone")}\nBusiness type: ${d.get("interest")}\n\n${d.get("message")}`;
    window.location.href = "mailto:jackson@jhsystemsgroup.com?subject=" + encodeURIComponent("Call request from " + d.get("name")) + "&body=" + encodeURIComponent(body);
    $(".form-ok", form).style.display = "block";
  });
})();
