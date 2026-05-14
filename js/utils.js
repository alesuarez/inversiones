function formatCurrency(value) {
    if (typeof value !== 'number') return '$0';
    return '$' + Math.round(value).toLocaleString('es-ES');
}

function abbreviateCurrency(value) {
    if (typeof value !== 'number' || value === 0) return '$0';
    var abs = Math.abs(value);
    if (abs >= 1000000) {
        var mill = (value / 1000000);
        return '$' + mill.toLocaleString('es-ES', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + 'M';
    }
    if (abs >= 1000) {
        var thou = (value / 1000);
        return '$' + thou.toLocaleString('es-ES', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + 'K';
    }
    return '$' + Math.round(value).toLocaleString('es-ES');
}

function getAge(value) {
    var n = parseInt(value);
    return isNaN(n) ? 0 : n;
}

function getMoney(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : Math.max(0, n);
}

function getRate(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}

function formatDecimal(value, digits) {
    if (typeof value !== 'number') return '0';
    digits = digits || 1;
    return value.toLocaleString('es-ES', {minimumFractionDigits: digits, maximumFractionDigits: digits});
}

function debounce(fn, delay) {
    var timer = null;
    return function () {
        var args = arguments;
        var ctx = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(ctx, args);
            timer = null;
        }, delay);
    };
}

function monthlyRateFromAnnual(annualPercent) {
    if (annualPercent <= 0) return 0;
    return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

var STORAGE_KEY = 'inversiones_simulador';

function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
}

function loadFromStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
