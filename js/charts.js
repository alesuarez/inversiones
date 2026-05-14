var chartInstance = null;

function renderChart(canvasId, investedTL, nonInvestedTL, retirementAge) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
        canvas.style.display = 'none';
        var parent = canvas.parentElement;
        var msg = parent.querySelector('.chart-fallback');
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'chart-fallback';
            msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:14px;text-align:center;padding:20px';
            msg.textContent = 'Chart.js no está disponible. Verifica tu conexión a internet.';
            parent.appendChild(msg);
        }
        return;
    }

    var fb = canvas.parentElement.querySelector('.chart-fallback');
    if (fb) fb.remove();
    canvas.style.display = '';

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // Encontrar el mes de agotamiento para no mostrar datos basura después
    var depletionMonth = null;
    for (var i = 0; i < investedTL.length; i++) {
        if (investedTL[i].phase === 'agotado' && investedTL[i].capital <= 0) {
            depletionMonth = investedTL[i].month;
            break;
        }
    }

    // Sample yearly data for the chart (solo hasta agotamiento)
    var labels = [];
    var dataInv = [];
    var dataNI = [];

    var retireIdx = -1;
    var agotadoAgregado = false;
    for (var i = 0; i < investedTL.length; i++) {
        var p = investedTL[i];
        if (depletionMonth !== null && p.month > depletionMonth) break;
        if (p.phase === 'inicio' || p.month % 12 === 0 || (p.phase === 'agotado' && !agotadoAgregado)) {
            if (p.phase === 'agotado') agotadoAgregado = true;
            if (labels.length === 0 || labels[labels.length - 1] !== p.age.toString()) {
                labels.push(p.age.toString());
                dataInv.push(p.capital);
                var ni = findClosest(nonInvestedTL, p.month);
                dataNI.push(ni ? ni.capital : 0);
                if (retireIdx < 0 && p.age >= retirementAge) retireIdx = labels.length - 1;
            }
        }
    }

    var ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Con inversión (capital + interés)',
                data: dataInv,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 6,
                borderWidth: 2
            }, {
                label: 'Sin inversión (solo aportes)',
                data: dataNI,
                borderColor: '#f87171',
                backgroundColor: 'rgba(248, 113, 113, 0.05)',
                fill: false,
                tension: 0.3,
                borderDash: [6, 4],
                pointRadius: 2,
                pointHoverRadius: 6,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ccc',
                        font: { size: 12 },
                        usePointStyle: true,
                        padding: 16
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 12, 41, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#ddd',
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(items) {
                            return 'Edad: ' + items[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': $' + Math.round(context.parsed.y).toLocaleString('es-ES');
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Edad', color: '#888' },
                    ticks: { color: '#888', maxTicksLimit: 15 },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                },
                y: {
                    title: { display: true, text: 'Valor ($)', color: '#888' },
                    ticks: {
                        color: '#888',
                        callback: function(v) { return '$' + v.toLocaleString('es-ES'); }
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                }
            }
        },
        plugins: [buildRetirementPlugin(retireIdx, retirementAge)]
    });
}

function findClosest(timeline, targetMonth) {
    var best = null;
    for (var i = 0; i < timeline.length; i++) {
        if (timeline[i].month <= targetMonth) best = timeline[i];
        else break;
    }
    return best;
}

function buildRetirementPlugin(retireIdx, retirementAge) {
    return {
        id: 'retirementLine',
        afterDraw: function(chart) {
            if (retireIdx < 0) return;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || retireIdx >= meta.data.length) return;
            var x = meta.data[retireIdx].x;
            var yScale = chart.scales.y;
            var ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(x, yScale.top);
            ctx.lineTo(x, yScale.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Retiro (' + retirementAge + ' años)', x, yScale.top);
            ctx.restore();
        }
    };
}
