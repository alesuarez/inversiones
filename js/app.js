// ── Referencias DOM ──
var DOM = {};

var EDAD_MAXIMA = 120;

function cacheDOM() {
    DOM.edad = document.getElementById('edad');
    DOM.retiro = document.getElementById('retiro');
    DOM.capital = document.getElementById('capital');
    DOM.interes = document.getElementById('interes');
    DOM.aporte = document.getElementById('aporte');
    DOM.retiroMensual = document.getElementById('retiroMensual');
    DOM.form = document.querySelector('.grid');
}

// ── Estados ──
var currentResult = null;

// ── Calcular ──
function calcular() {
    cacheDOM();

    var currentAge = getAge(DOM.edad.value) || 30;
    var retirementAge = getAge(DOM.retiro.value) || 65;
    var initialCapital = getMoney(DOM.capital.value) || 0;
    var annualReturnRate = getRate(DOM.interes.value) || 0;
    var monthlyContribution = getMoney(DOM.aporte.value) || 0;
    var monthlyWithdrawal = getMoney(DOM.retiroMensual.value) || 0;

    if (currentAge >= retirementAge) {
        alert('La edad de retiro debe ser mayor a la edad actual.');
        return;
    }

    var params = {
        currentAge: currentAge,
        retirementAge: retirementAge,
        maxAge: EDAD_MAXIMA,
        initialCapital: initialCapital,
        monthlyContribution: monthlyContribution,
        annualReturnRate: annualReturnRate,
        monthlyWithdrawal: monthlyWithdrawal
    };

    currentResult = simulate(params);
    currentResult.params = params;

    renderSummary(currentResult);
    renderTable(currentResult);
    renderChart('chart', currentResult.invested.timeline, currentResult.nonInvested.timeline, retirementAge);
    saveToStorage(params);
    updateURL(params);
}

// ── URL params (compartir) ──
function buildQueryString() {
    cacheDOM();
    var e = encodeURIComponent(DOM.edad.value || 39);
    var r = encodeURIComponent(DOM.retiro.value || 65);
    var c = encodeURIComponent(DOM.capital.value || 0);
    var i = encodeURIComponent(DOM.interes.value || 0);
    var a = encodeURIComponent(DOM.aporte.value || 0);
    var w = encodeURIComponent(DOM.retiroMensual.value || 0);
    return '?e=' + e + '&r=' + r + '&c=' + c + '&i=' + i + '&a=' + a + '&w=' + w;
}

function updateURL(params) {
    var q = buildQueryString();
    if (history.replaceState) {
        try { history.replaceState(null, '', q); } catch(e) {}
    }
}

function readURLParams() {
    var p = location.search.substr(1).split('&');
    var map = {};
    for (var i = 0; i < p.length; i++) {
        var kv = p[i].split('=');
        if (kv.length === 2) map[kv[0]] = decodeURIComponent(kv[1]);
    }
    return map;
}

function compartirSimulacion() {
    var url = buildShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
            mostrarToast();
        }).catch(function() {
            fallbackCopiar(url);
        });
    } else {
        fallbackCopiar(url);
    }
}

function buildShareUrl() {
    var base = location.protocol + '//' + location.host + location.pathname;
    base = base.replace(/\/index\.html$/i, '');
    base = base.replace(/\/+$/, '');
    var q = buildQueryString();
    return base + '/' + q.replace(/^\//, '');
}

function mostrarToast() {
    var toast = document.getElementById('shareToast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function fallbackCopiar(url) {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); mostrarToast(); } catch(e) {}
    document.body.removeChild(ta);
}

// ── Renderizar resumen ──
function renderSummary(result) {
    var inv = result.invested.metrics;
    var ni = result.nonInvested.metrics;
    var cmp = result.comparison;

    setText('totalAportado', formatCurrency(inv.totalContributed));
    setText('totalRetirado', formatCurrency(inv.totalWithdrawn));
    setText('interesTotal', formatCurrency(inv.totalInterestGenerated));
    setText('capitalMaximo', formatCurrency(inv.maxCapital));
    setText('valorAlRetiro', formatCurrency(inv.capitalAtRetirement));
    setText('valorAlRetiroNI', formatCurrency(ni.capitalAtRetirement));
    setText('diferenciaAbsoluta', formatCurrency(cmp.differenceAbsolute));
    setText('diferenciaPorcentual', (cmp.differencePercent >= 0 ? '+' : '') + formatDecimal(cmp.differencePercent, 1) + '%');

    var retiroVal = result.params ? result.params.monthlyWithdrawal : 0;
    setText('retiroMensualDisplay', formatCurrency(retiroVal));
    setText('interesMensualRetiro', formatCurrency(inv.monthlyInterestAtRetirement));

    // Texto explicativo
    var expEl = document.getElementById('explicacionTexto');
    if (expEl) {
        if (retiroVal > 0 && inv.capitalAtRetirement > 0) {
            var interesStr = inv.monthlyInterestAtRetirement.toLocaleString('es-ES');
            var retiroStr = retiroVal.toLocaleString('es-ES');
            var durStr = (inv.retirementDuration || 0).toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
            if (inv.isSustainable) {
                expEl.innerHTML = 'El capital <strong style="color:#4ade80">sigue creciendo</strong> porque el interés mensual (<strong>$' +
                    interesStr + '</strong>) es mayor que el retiro mensual (<strong>$' +
                    retiroStr + '</strong>). Para que decrezca, el retiro debe superar los <strong>$' +
                    interesStr + '</strong> mensuales.';
            } else {
                expEl.innerHTML = 'El capital <strong style="color:#f87171">decrece</strong> porque el retiro mensual (<strong>$' +
                    retiroStr + '</strong>) supera al interés mensual (<strong>$' +
                    interesStr + '</strong>). Se agotará en <strong>' +
                    durStr + ' años</strong>.';
            }
        } else {
            expEl.innerHTML = 'Sin retiro, el capital sigue creciendo por el interés compuesto. Activa un retiro mensual para ver el efecto.';
        }
    }

    if (inv.isSustainable) {
        setText('duracionRetiro', 'Ilimitado (crece)');
        setText('edadAgotamiento', 'Nunca se agota');
    } else if (inv.ageAtDepletion !== null) {
        var dur = inv.retirementDuration.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
        var edad = inv.ageAtDepletion.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
        setText('duracionRetiro', dur + ' años');
        setText('edadAgotamiento', edad + ' años');
    } else {
        setText('duracionRetiro', '—');
        setText('edadAgotamiento', '—');
    }

    if (ni.ageAtDepletion !== null) {
        var durNI = ni.retirementDuration.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
        var edadNI = ni.ageAtDepletion.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
        setText('duracionSinInteres', durNI + ' años');
        setText('edadSinInteres', edadNI + ' años');
    } else if (retiroVal > 0) {
        setText('duracionSinInteres', 'Nunca (crece)');
        setText('edadSinInteres', 'Nunca');
    } else {
        setText('duracionSinInteres', '—');
        setText('edadSinInteres', '—');
    }
}

function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ── Renderizar tabla ──
function renderTable(result) {
    var tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';

    var invTL = result.invested.timeline;
    var niTL = result.nonInvested.timeline;

    // Encontrar el mes de agotamiento (primera entrada con fase 'agotado')
    var depletionMonth = null;
    for (var i = 0; i < invTL.length; i++) {
        if (invTL[i].phase === 'agotado' && invTL[i].capital <= 0) {
            depletionMonth = invTL[i].month;
            break;
        }
    }

    var showMonths = {};
    for (var i = 0; i < invTL.length; i++) {
        var p = invTL[i];
        // Mostrar año 0, cada 12 meses, y la primera entrada de agotamiento
        if (p.month === 0 || p.month % 12 === 0) {
            showMonths[p.month] = true;
        }
        if (depletionMonth !== null && p.month === depletionMonth) {
            showMonths[p.month] = true;
        }
        // Dejar de procesar después del agotamiento
        if (depletionMonth !== null && p.month >= depletionMonth) break;
    }

    for (var i = 0; i < invTL.length; i++) {
        var p = invTL[i];
        if (!showMonths[p.month]) continue;
        // No mostrar más allá del agotamiento
        if (depletionMonth !== null && p.month > depletionMonth) break;

        var ni = findClosest(niTL, p.month);

        var tagClass = 'tag-';
        if (p.phase === 'acumulación') tagClass += 'acum';
        else if (p.phase === 'retiro') tagClass += 'retiro';
        else if (p.phase === 'agotado') tagClass += 'agotado';
        else tagClass += 'inicio';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + formatDecimal(p.age, 1) + '</td>' +
            '<td>' + p.month + '</td>' +
            '<td><span class="' + tagClass + '">' + p.phase + '</span></td>' +
            '<td>' + formatCurrency(p.capital) + '</td>' +
            '<td>' + formatCurrency(p.interestGenerated) + '</td>' +
            '<td>' + formatCurrency(p.contribution) + '</td>' +
            '<td>' + formatCurrency(p.withdrawal) + '</td>' +
            '<td>' + formatCurrency(ni ? ni.capital : 0) + '</td>';
        tbody.appendChild(tr);
    }
}

function findClosest(timeline, month) {
    for (var i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].month <= month) return timeline[i];
    }
    return null;
}

// ── Escenarios preconfigurados ──
function aplicarEscenario(tipo) {
    var escenarios = {
        conservador: { interes: 4, aporte: 300 },
        moderado: { interes: 8, aporte: 500 },
        agresivo: { interes: 12, aporte: 800 }
    };

    var esc = escenarios[tipo];
    if (!esc) return;

    cacheDOM();
    DOM.interes.value = esc.interes;
    DOM.aporte.value = esc.aporte;
    calcular();
}

// ── Reset ──
function resetear() {
    cacheDOM();
    DOM.edad.value = 39;
    DOM.retiro.value = 65;

    DOM.capital.value = 10000;
    DOM.interes.value = 8;
    DOM.aporte.value = 500;
    DOM.retiroMensual.value = 2000;
    calcular();
}

// ── Init ──
function init() {
    cacheDOM();
    var urlParams = readURLParams();
    if (urlParams.e) {
        if (DOM.edad) DOM.edad.value = urlParams.e;
        if (DOM.retiro) DOM.retiro.value = urlParams.r || 65;
        if (DOM.capital) DOM.capital.value = urlParams.c || 0;
        if (DOM.interes) DOM.interes.value = urlParams.i || 0;
        if (DOM.aporte) DOM.aporte.value = urlParams.a || 0;
        if (DOM.retiroMensual) DOM.retiroMensual.value = urlParams.w || 0;
    } else {
        var saved = loadFromStorage();
        if (saved) {
            if (saved.currentAge && DOM.edad) DOM.edad.value = saved.currentAge;
            if (saved.retirementAge && DOM.retiro) DOM.retiro.value = saved.retirementAge;
            if (saved.initialCapital !== undefined && DOM.capital) DOM.capital.value = saved.initialCapital;
            if (saved.annualReturnRate !== undefined && DOM.interes) DOM.interes.value = saved.annualReturnRate;
            if (saved.monthlyContribution !== undefined && DOM.aporte) DOM.aporte.value = saved.monthlyContribution;
            if (saved.monthlyWithdrawal !== undefined && DOM.retiroMensual) DOM.retiroMensual.value = saved.monthlyWithdrawal;
        }
    }

    var inputs = DOM.form.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
        (function(el) {
            el.addEventListener('input', debounce(calcular, 150));
            el.addEventListener('change', calcular);
        })(inputs[i]);
    }

    calcular();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
