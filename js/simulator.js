function simulate(params) {
    var currentAge = params.currentAge;
    var retirementAge = params.retirementAge;
    var maxAge = params.maxAge;
    var initialCapital = params.initialCapital;
    var monthlyContribution = params.monthlyContribution;
    var annualReturnRate = params.annualReturnRate;
    var monthlyWithdrawal = params.monthlyWithdrawal;

    var monthlyRate = monthlyRateFromAnnual(annualReturnRate);
    var totalMonths = (maxAge - currentAge) * 12;
    var retireMonth = Math.max(0, (retirementAge - currentAge) * 12);

    // ── Escenario con inversión ──
    var invTL = [];
    var cap = initialCapital;
    var totalContrib = initialCapital;
    var totalInterest = 0;
    var totalWithdr = 0;
    var maxCap = initialCapital;
    var ageMaxCap = currentAge;
    var depletedInv = false;

    for (var m = 0; m <= totalMonths; m++) {
        var age = +(currentAge + m / 12).toFixed(2);

        if (m === 0) {
            invTL.push(makePoint(age, 0, 'inicio', cap, 0, 0, 0, totalContrib));
            continue;
        }

        if (depletedInv) {
            invTL.push(makePoint(age, m, 'agotado', 0, 0, 0, 0, totalContrib));
            continue;
        }

        var interest = cap * monthlyRate;
        var contrib = 0;
        var withdraw = 0;
        var phase = '';

        if (m <= retireMonth) {
            cap = cap + interest + monthlyContribution;
            totalContrib += monthlyContribution;
            totalInterest += interest;
            contrib = monthlyContribution;
            phase = 'acumulación';
        } else {
            if (monthlyWithdrawal > 0) {
                withdraw = Math.min(monthlyWithdrawal, cap + interest);
                cap = cap + interest - withdraw;
                totalInterest += interest;
                totalWithdr += withdraw;
                if (cap <= 0.01) {
                    cap = 0;
                    depletedInv = true;
                    phase = 'agotado';
                } else {
                    phase = 'retiro';
                }
            } else {
                cap = cap + interest;
                totalInterest += interest;
                phase = 'acumulación';
            }
        }

        if (cap > maxCap) { maxCap = cap; ageMaxCap = age; }

        invTL.push(makePoint(age, m, phase, Math.max(0, cap), interest, contrib, withdraw, totalContrib));
    }

    // ── Escenario sin inversión ──
    var niTL = [];
    var capNI = initialCapital;
    var totalContribNI = initialCapital;
    var totalWithdrNI = 0;
    var depletedNI = false;

    for (var m = 0; m <= totalMonths; m++) {
        var age = +(currentAge + m / 12).toFixed(2);

        if (m === 0) {
            niTL.push(makePoint(age, 0, 'inicio', capNI, 0, 0, 0, totalContribNI));
            continue;
        }

        if (depletedNI) {
            niTL.push(makePoint(age, m, 'agotado', 0, 0, 0, 0, totalContribNI));
            continue;
        }

        var contrib = 0;
        var withdraw = 0;

        if (m <= retireMonth) {
            capNI += monthlyContribution;
            totalContribNI += monthlyContribution;
            contrib = monthlyContribution;
        } else {
            if (monthlyWithdrawal > 0) {
                withdraw = Math.min(monthlyWithdrawal, capNI);
                capNI -= withdraw;
                totalWithdrNI += withdraw;
                if (capNI <= 0.01) {
                    capNI = 0;
                    depletedNI = true;
                }
            }
        }

        var phase = depletedNI ? 'agotado' : (m <= retireMonth ? 'acumulación' : 'retiro');
        niTL.push(makePoint(age, m, phase, Math.max(0, capNI), 0, contrib, withdraw, totalContribNI));
    }

    // ── Métricas ──
    var invLast = invTL[invTL.length - 1];
    var niLast = niTL[niTL.length - 1];

    var invAtRetire = findFirst(invTL, function(p) { return p.month >= retireMonth && p.phase === 'acumulación'; });
    var niAtRetire = findFirst(niTL, function(p) { return p.month >= retireMonth && p.phase === 'acumulación'; });

    var capAtRetireInv = invAtRetire ? invAtRetire.capital : 0;
    var capAtRetireNI = niAtRetire ? niAtRetire.capital : 0;

    var ageDepleteInv = invLast.phase === 'agotado' && invLast.capital <= 0 ? invLast.age : null;
    var ageDepleteNI = niLast.phase === 'agotado' && niLast.capital <= 0 ? niLast.age : null;

    // Find first depletion age (not the trailing zeros)
    var firstDepleteInv = findFirst(invTL, function(p) { return p.phase === 'agotado' && p.capital <= 0; });
    var firstDepleteNI = findFirst(niTL, function(p) { return p.phase === 'agotado' && p.capital <= 0; });
    if (firstDepleteInv) ageDepleteInv = firstDepleteInv.age;
    if (firstDepleteNI) ageDepleteNI = firstDepleteNI.age;

    var monthlyInterestAtRetirement = capAtRetireInv * monthlyRate;

    var metricsInv = {
        totalContributed: Math.round(totalContrib),
        totalWithdrawn: Math.round(totalWithdr),
        totalInterestGenerated: Math.round(totalInterest),
        maxCapital: Math.round(maxCap),
        ageAtMaxCapital: ageMaxCap,
        capitalAtRetirement: Math.round(capAtRetireInv),
        monthlyInterestAtRetirement: Math.round(monthlyInterestAtRetirement),
        monthlyWithdrawal: Math.round(monthlyWithdrawal),
        ageAtDepletion: ageDepleteInv,
        retirementDuration: ageDepleteInv !== null ? +(ageDepleteInv - retirementAge).toFixed(1) : null,
        isSustainable: monthlyWithdrawal > 0 && capAtRetireInv > 0 && monthlyInterestAtRetirement >= monthlyWithdrawal
    };

    var metricsNI = {
        totalContributed: Math.round(totalContribNI),
        totalWithdrawn: Math.round(totalWithdrNI),
        totalInterestGenerated: 0,
        maxCapital: Math.round(capAtRetireNI),
        ageAtMaxCapital: retirementAge,
        capitalAtRetirement: Math.round(capAtRetireNI),
        ageAtDepletion: ageDepleteNI,
        retirementDuration: ageDepleteNI !== null ? +(ageDepleteNI - retirementAge).toFixed(1) : null,
        isSustainable: false
    };

    var diffAbs = capAtRetireInv - capAtRetireNI;
    var diffPct = capAtRetireNI > 0 ? (diffAbs / capAtRetireNI * 100) : 0;

    return {
        invested: { timeline: invTL, metrics: metricsInv },
        nonInvested: { timeline: niTL, metrics: metricsNI },
        comparison: {
            differenceAbsolute: Math.round(diffAbs),
            differencePercent: +diffPct.toFixed(1),
            investedRunsOutAt: ageDepleteInv,
            nonInvestedRunsOutAt: ageDepleteNI
        }
    };
}

function makePoint(age, month, phase, capital, interestGenerated, contribution, withdrawal, totalContributions) {
    return {
        age: age,
        month: month,
        phase: phase,
        capital: Math.round(Math.max(0, capital)),
        interestGenerated: Math.round(interestGenerated),
        contribution: Math.round(contribution),
        withdrawal: Math.round(withdrawal),
        totalContributions: Math.round(totalContributions)
    };
}

function findFirst(arr, predicate) {
    for (var i = 0; i < arr.length; i++) {
        if (predicate(arr[i])) return arr[i];
    }
    return null;
}
