/* Propuesta DJI para condominios — comportamiento.
   El contenido ya está en el HTML; aquí solo se personaliza y se anima. */
(function () {
  "use strict";

  var B = window.__BRAND__ || {};
  var PAQ = B.paquetes || {
    esencial: { nombre: "Esencial", total: 16098 },
    seguridad: { nombre: "Seguridad", total: 21236 },
    completo: { nombre: "Completo", total: 27674 }
  };
  var params = new URLSearchParams(location.search);
  var estado = { condo: "", admin: "", casas: B.casasDefault || 60, paquete: "seguridad", meses: B.mesesDefault || 12, unidad: ["casa", "casas"] };

  // Formato de Guatemala sin espacio: Q22.12 · Q21,236
  var n2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var n0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  var q2 = { format: function (v) { return "Q" + n2.format(v); } };
  var q0 = { format: function (v) { return "Q" + n0.format(v); } };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function setText(sel, txt) { $$(sel).forEach(function (el) { el.textContent = txt; }); }

  function limpiarNombre(s) {
    return String(s || "").replace(/[_+]+/g, " ").replace(/\s+-\s+|-/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  }

  /* ---------- Personalización por link ----------
     ?c=Edificio-Boulevard-5   nombre del condominio o edificio
     &a=Puerta-Abierta         administradora (opcional)
     &t=edificio               fuerza el modo edificio (se detecta solo si el nombre empieza con "Edificio" o "Torre")
     &casas=80&p=completo      unidades y paquete a destacar */
  function personalizar() {
    var casas = parseInt(params.get("casas"), 10);
    var p = (params.get("p") || "").toLowerCase();
    if (casas > 0 && casas <= 2000) estado.casas = casas;
    if (PAQ[p]) {
      estado.paquete = p;
      var card = $('[data-pkg="' + p + '"]');
      if (card) card.classList.add("is-sel");
    }

    var c = limpiarNombre(params.get("c"));
    var adm = limpiarNombre(params.get("a"));
    var t = (params.get("t") || "").toLowerCase();
    var edificio = t === "edificio" || (t !== "condominio" && /^(edificio|torre|torres|apartamentos)\b/i.test(c));

    if (edificio) {
      estado.unidad = ["apartamento", "apartamentos"];
      document.documentElement.classList.add("modo-edificio");
      $$("[data-ed]").forEach(function (el) { el.textContent = el.getAttribute("data-ed"); });
      var mapa = $("[data-map]");
      if (mapa) mapa.setAttribute("aria-label", "Ilustración: vista aérea de un edificio con la ruta del dron alrededor de la fachada y una zona de la azotea marcada para revisión");
    }
    if (adm) {
      estado.admin = adm;
      $$("[data-adm]").forEach(function (el) { el.textContent = el.getAttribute("data-adm"); });
      setText("[data-admin]", adm);
      $$("[data-solo-admin]").forEach(function (el) { el.hidden = false; });
    }

    if (!c) return;
    estado.condo = c;
    setText("[data-condo]", c);
    // Que "Boulevard 5" no se parta en dos renglones
    setText("[data-condo-h1]", c.replace(/ (\S{1,3})$/, " $1"));
    var h1 = $(".hero-title");
    if (h1 && c.length > 14) h1.classList.add("is-largo");
    setText("[data-h1-em]", "desde el aire."); // "visto" no concuerda con nombres como "Los Pinos"
    setText("[data-condo-map]", c);
    if (!(casas > 0)) setText("[data-nota-pre]", "Ejemplo: paquete Seguridad entre");
    document.title = "Propuesta DJI · " + c;
  }

  /* ---------- Calculadora ---------- */
  function porCasa(clave) {
    var total = PAQ[clave].total;
    var unico = total / estado.casas;
    return { total: total, unico: unico, mes: unico / estado.meses };
  }

  function pintarCalculo(animar) {
    var r = porCasa(estado.paquete);
    var unCobro = estado.meses === 1;
    var big = $("[data-out-mes]");
    if (big) {
      big.textContent = q2.format(unCobro ? r.unico : r.mes);
      if (animar) { big.classList.remove("bump"); void big.offsetWidth; big.classList.add("bump"); }
    }
    var u = estado.unidad;
    setText("[data-out-cap]", unCobro ? "por " + u[0] + ", en un solo cobro" : "por " + u[0] + " al mes, durante " + estado.meses + " meses");
    setText("[data-out-total]", q0.format(r.total));
    setText("[data-out-unico]", q2.format(r.unico));
    setText("[data-out-unico-lbl]", "Por " + u[0] + " en un solo cobro");

    $$("[data-por-casa]").forEach(function (el) {
      var v = porCasa(el.getAttribute("data-por-casa"));
      el.textContent = q2.format(unCobro ? v.unico : v.mes) + (unCobro ? " por " + u[0] + ", un solo cobro" : " por " + u[0] + " al mes");
    });
    setText("[data-casa-note]", estado.casas + " " + u[1] + (unCobro ? "" : " · " + estado.meses + " meses"));

    var seg = PAQ.seguridad.total / estado.casas / 12;
    setText("[data-stat-mes]", q2.format(seg));
    setText("[data-stat-casas]", String(estado.casas));
  }

  function initCalculadora() {
    var form = $("[data-calc]");
    if (!form) return;
    var num = $("[data-casas]", form);
    var rango = $("[data-casas-range]", form);

    num.value = estado.casas;
    rango.value = Math.min(Math.max(estado.casas, 10), 300);
    var radioP = $('input[name="paquete"][value="' + estado.paquete + '"]', form);
    if (radioP) radioP.checked = true;
    var radioM = $('input[name="meses"][value="' + estado.meses + '"]', form);
    if (radioM) radioM.checked = true;

    function leerCasas(v) {
      var n = parseInt(v, 10);
      if (!(n > 0)) return false;
      estado.casas = Math.min(n, 2000);
      return true;
    }
    rango.addEventListener("input", function () {
      if (leerCasas(rango.value)) { num.value = estado.casas; pintarCalculo(false); }
    });
    num.addEventListener("input", function () {
      if (leerCasas(num.value)) { rango.value = Math.min(Math.max(estado.casas, 10), 300); pintarCalculo(false); }
    });
    num.addEventListener("blur", function () { num.value = estado.casas; });
    form.addEventListener("change", function (e) {
      if (e.target.name === "paquete") { estado.paquete = e.target.value; pintarCalculo(true); }
      if (e.target.name === "meses") { estado.meses = parseInt(e.target.value, 10) || 12; pintarCalculo(true); }
    });
    pintarCalculo(false);
  }

  /* ---------- WhatsApp y asesor ---------- */
  function numeroWhatsApp() {
    var n = String((B.asesor && B.asesor.whatsapp) || "").replace(/\D/g, "");
    if (n.length === 8) n = "502" + n;
    return n.length >= 10 ? n : "";
  }

  function mensajeWhatsApp(paquete) {
    var lugar = "";
    if (estado.condo) {
      lugar = /^(condominio|residencial|residenciales|condado|colonia|edificio|torre|torres|apartamentos)\b/i.test(estado.condo)
        ? estado.condo
        : (estado.unidad[0] === "apartamento" ? "el edificio " : "el condominio ") + estado.condo;
    }
    var quien;
    if (estado.admin) quien = "de " + estado.admin + (lugar ? ", por " + lugar : "");
    else quien = lugar ? (/^el /.test(lugar) ? "d" + lugar : "de " + lugar) : "de un condominio";
    var m = "Hola, le escribo " + quien + ". Vimos la propuesta DJI";
    if (paquete) m += " y nos interesa el paquete " + paquete;
    return m + ". ¿Podemos agendar una presentación" + (estado.admin ? "?" : " para la junta directiva?");
  }

  function initWhatsApp() {
    var num = numeroWhatsApp();
    $$("[data-wa]").forEach(function (a) {
      if (!num) return; // sin número configurado, el botón lleva a la sección de contacto
      var armar = function () {
        a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(mensajeWhatsApp(a.getAttribute("data-paquete")));
      };
      armar();
      a.target = "_blank";
      a.rel = "noopener";
      a.addEventListener("click", armar);
    });
  }

  function initAsesor() {
    var a = B.asesor || {};
    if (a.nombre) {
      setText("[data-asesor-nombre]", a.nombre);
      var ini = a.nombre.trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join("");
      setText("[data-asesor-ini]", ini || "DJI");
    }
    if (a.cargo) setText("[data-asesor-cargo]", a.cargo);
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 12); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var cont = $("[data-nav-links]");
    var ink = cont && $(".nav-ink", cont);
    if (!cont || !ink) return;
    var links = $$("a", cont);
    var activo = null;

    function mover(a) {
      if (!a) { ink.style.opacity = "0"; return; }
      ink.style.width = (a.offsetWidth - 28) + "px";
      ink.style.transform = "translateX(" + (a.offsetLeft + 14) + "px)";
      ink.style.opacity = "1";
    }
    links.forEach(function (a) {
      a.addEventListener("mouseover", function () { mover(a); });
      a.addEventListener("focus", function () { mover(a); });
    });
    cont.addEventListener("mouseout", function (e) {
      if (!cont.contains(e.relatedTarget)) mover(activo);
    });

    if (!("IntersectionObserver" in window)) return;
    var secciones = links.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = "#" + en.target.id;
        activo = null;
        links.forEach(function (a) {
          var es = a.getAttribute("href") === id;
          a.classList.toggle("is-active", es);
          if (es) activo = a;
        });
        mover(activo);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    secciones.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function initReveal() {
    var els = $$("[data-reveal]");
    var mostrar = function (el) { el.classList.add("is-visible"); };
    if (!("IntersectionObserver" in window)) { els.forEach(mostrar); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { mostrar(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (el) { io.observe(el); });
    // Red de seguridad: nada se queda escondido.
    setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) mostrar(el);
      });
    }, 6000);
    window.addEventListener("beforeprint", function () {
      els.forEach(mostrar);
      $$(".faq details").forEach(function (d) { d.open = true; });
    });
  }

  /* ---------- Botones magnéticos ---------- */
  function initMagnet() {
    if (window.matchMedia("(hover: none)").matches) return;
    $$("[data-magnet]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.2).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px)";
      });
      el.addEventListener("mouseout", function (e) {
        if (!el.contains(e.relatedTarget)) el.style.transform = "";
      });
    });
  }

  /* ---------- Uso interno: armar link personalizado (abrir con #armar) ---------- */
  function initArmar() {
    var dlg = $("[data-armar]");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var inC = $("[data-armar-c]", dlg);
    var inA = $("[data-armar-a]", dlg);
    var inT = $("[data-armar-t]", dlg);
    var inCasas = $("[data-armar-casas]", dlg);
    var inP = $("[data-armar-p]", dlg);
    var out = $("[data-armar-out]", dlg);
    var abrir = $("[data-armar-abrir]", dlg);
    var copiar = $("[data-armar-copiar]", dlg);
    var base = location.origin + location.pathname;

    function generar() {
      var p = new URLSearchParams();
      var c = inC.value.trim().replace(/\s+/g, "-");
      if (c) p.set("c", c);
      var a = inA.value.trim().replace(/\s+/g, "-");
      if (a) p.set("a", a);
      if (inT.value) p.set("t", inT.value);
      var n = parseInt(inCasas.value, 10);
      if (n > 0) p.set("casas", String(n));
      if (inP.value) p.set("p", inP.value);
      var s = p.toString();
      out.value = base + (s ? "?" + s : "");
      abrir.href = out.value;
    }
    [inC, inA, inT, inCasas, inP].forEach(function (el) { el.addEventListener("input", generar); });
    copiar.addEventListener("click", function () {
      generar();
      var hecho = function () { copiar.textContent = "¡Copiado!"; setTimeout(function () { copiar.textContent = "Copiar link"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(hecho, function () { out.select(); });
      else { out.select(); document.execCommand("copy"); hecho(); }
    });
    dlg.addEventListener("close", function () {
      if (location.hash === "#armar") history.replaceState(null, "", location.pathname + location.search);
    });

    function revisar() {
      if (location.hash === "#armar" && !dlg.open) {
        if (estado.condo) inC.value = estado.condo;
        if (estado.admin) inA.value = estado.admin;
        generar();
        dlg.showModal();
      }
    }
    window.addEventListener("hashchange", revisar);
    revisar();
  }

  function boot() {
    safe(personalizar, "personalizar");
    safe(initAsesor, "initAsesor");
    safe(initCalculadora, "initCalculadora");
    safe(initWhatsApp, "initWhatsApp");
    safe(initNav, "initNav");
    safe(initReveal, "initReveal");
    safe(initMagnet, "initMagnet");
    safe(initArmar, "initArmar");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
