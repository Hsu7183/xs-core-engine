(function () {
    const DEFAULT_CFG = {
        capital: 1000000,
        pointValue: 200,
        feePerSide: 45,
        taxRate: 0.00002,
        slipPerSide: 2,
    };

    function toNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function hasFiniteValue(value) {
        return value !== null
            && value !== undefined
            && value !== ""
            && Number.isFinite(Number(value));
    }

    function round1(value) {
        return Math.round(Number(value || 0) * 10) / 10;
    }

    function round2(value) {
        return Math.round(Number(value || 0) * 100) / 100;
    }

    function normalizeConfig(input) {
        const source = input || {};
        const capital = Math.max(1, toNumber(source.capital, DEFAULT_CFG.capital));
        const pointValue = Math.max(1, toNumber(source.pointValue, DEFAULT_CFG.pointValue));
        const feePerSide = Math.max(0, toNumber(source.feePerSide, DEFAULT_CFG.feePerSide));
        const taxRate = Math.max(0, toNumber(source.taxRate, DEFAULT_CFG.taxRate));
        const slipPerSide = Math.max(0, toNumber(source.slipPerSide, DEFAULT_CFG.slipPerSide));

        return {
            capital: capital,
            pointValue: pointValue,
            feePerSide: feePerSide,
            taxRate: taxRate,
            slipPerSide: slipPerSide,
            slipMoneyPerContract: slipPerSide * 2 * pointValue,
        };
    }

    function deriveAuthorityPnls(trades) {
        let previousAccum = 0;
        let hasAccum = false;

        return (Array.isArray(trades) ? trades : []).map(function (trade) {
            const accum = Number(trade && trade.accumProfit);
            if (!Number.isFinite(accum)) {
                return null;
            }

            const pnl = hasAccum ? (accum - previousAccum) : accum;
            previousAccum = accum;
            hasAccum = true;
            return pnl;
        });
    }

    function inferPoints(trade, side, entryPrice, exitPrice) {
        if (hasFiniteValue(trade && trade.points)) {
            return Number(trade.points);
        }

        if (hasFiniteValue(trade && trade.grossPoints)) {
            return Number(trade.grossPoints);
        }

        if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !side) {
            return null;
        }

        return side === "long"
            ? (exitPrice - entryPrice)
            : (entryPrice - exitPrice);
    }

    function buildTradeDetail(trade, config, authorityPnl) {
        const quantity = Math.max(1, toNumber(trade && trade.quantity, 1));
        const side = trade && (trade.side === "long" || trade.side === "short")
            ? trade.side
            : null;
        const entryPrice = toNumber(trade && trade.entryPrice, NaN);
        const exitPrice = toNumber(trade && trade.exitPrice, NaN);
        const points = inferPoints(trade, side, entryPrice, exitPrice);
        const gross = Number.isFinite(points)
            ? points * config.pointValue * quantity
            : null;
        const fee = config.feePerSide * 2 * quantity;
        const tax = Number.isFinite(entryPrice) && Number.isFinite(exitPrice)
            ? Math.round(entryPrice * config.pointValue * config.taxRate * quantity)
                + Math.round(exitPrice * config.pointValue * config.taxRate * quantity)
            : 0;

        let theoryPnl = hasFiniteValue(authorityPnl) ? Number(authorityPnl) : null;

        if (!Number.isFinite(theoryPnl) && hasFiniteValue(trade && trade.theoryPnl)) {
            theoryPnl = Number(trade.theoryPnl);
        }

        if (!Number.isFinite(theoryPnl) && Number.isFinite(gross)) {
            theoryPnl = gross - fee - tax;
        }

        if (!Number.isFinite(theoryPnl) && hasFiniteValue(trade && trade.pnlCurrency)) {
            theoryPnl = Number(trade.pnlCurrency);
        }

        const slipCost = config.slipMoneyPerContract * quantity;
        const actualPnl = Number.isFinite(theoryPnl)
            ? theoryPnl - slipCost
            : null;

        return {
            side: side,
            entryTs: trade && trade.entryTs ? String(trade.entryTs) : "",
            exitTs: trade && trade.exitTs ? String(trade.exitTs) : "",
            entryPrice: Number.isFinite(entryPrice) ? entryPrice : null,
            exitPrice: Number.isFinite(exitPrice) ? exitPrice : null,
            quantity: quantity,
            points: Number.isFinite(points) ? points : null,
            gross: Number.isFinite(gross) ? gross : null,
            fee: fee,
            tax: tax,
            slipCost: slipCost,
            theoryPnl: Number.isFinite(theoryPnl) ? theoryPnl : null,
            actualPnl: Number.isFinite(actualPnl) ? actualPnl : null,
        };
    }

    function buildAnnualReturns(details, field, capital) {
        const annualMap = new Map();

        (Array.isArray(details) ? details : []).forEach(function (detail) {
            const pnl = Number(detail && detail[field]);
            const year = String(detail && detail.exitTs || "").slice(0, 4);
            if (!year || !Number.isFinite(pnl)) {
                return;
            }
            annualMap.set(year, (annualMap.get(year) || 0) + pnl);
        });

        const years = Array.from(annualMap.keys()).sort();
        const lastYear = years.length ? Number(years[years.length - 1]) : new Date().getFullYear();
        const items = [];

        for (let year = lastYear - 5; year <= lastYear; year += 1) {
            const pnl = annualMap.get(String(year)) || 0;
            items.push({
                year: year,
                value: round1((pnl / capital) * 100),
            });
        }

        return items;
    }

    function buildStats(details, field, capital) {
        const safeDetails = Array.isArray(details) ? details : [];
        const dailyMap = new Map();
        const pnlList = [];
        let totalNet = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let winCount = 0;
        let lossCount = 0;
        let peak = 0;
        let cumulative = 0;
        let cumulativeHigh = 0;
        let maxDrawdown = 0;

        safeDetails.forEach(function (detail) {
            const pnl = Number(detail && detail[field]);
            if (!Number.isFinite(pnl)) {
                return;
            }

            pnlList.push(pnl);
            totalNet += pnl;

            if (pnl > 0) {
                winCount += 1;
                grossProfit += pnl;
            } else if (pnl < 0) {
                lossCount += 1;
                grossLoss += pnl;
            }

            const dayKey = String(detail && detail.exitTs || "").slice(0, 8);
            if (dayKey) {
                dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + pnl);
            }

            cumulative += pnl;
            cumulativeHigh = Math.max(cumulativeHigh, cumulative);
            peak = Math.max(peak, cumulative);
            maxDrawdown = Math.max(maxDrawdown, peak - cumulative);
        });

        const dayValues = Array.from(dailyMap.values());
        const count = pnlList.length;
        const averageWinner = winCount ? (grossProfit / winCount) : 0;
        const averageLoser = lossCount ? (grossLoss / lossCount) : 0;

        return {
            count: count,
            winCount: winCount,
            lossCount: lossCount,
            winRate: count ? (winCount / count) : 0,
            loseRate: count ? (lossCount / count) : 0,
            totalNet: totalNet,
            totalReturnPct: (totalNet / capital) * 100,
            averageTrade: count ? (totalNet / count) : 0,
            averageWinner: averageWinner,
            averageLoser: averageLoser,
            profitFactor: grossLoss < 0 ? (grossProfit / Math.abs(grossLoss)) : null,
            maxSingleWin: pnlList.length ? Math.max.apply(null, pnlList) : 0,
            maxSingleLoss: pnlList.length ? Math.min.apply(null, pnlList) : 0,
            dayMax: dayValues.length ? Math.max.apply(null, dayValues) : 0,
            dayMin: dayValues.length ? Math.min.apply(null, dayValues) : 0,
            cumulativeHigh: cumulativeHigh,
            maxDrawdown: maxDrawdown,
            annualReturns: buildAnnualReturns(safeDetails, field, capital),
        };
    }

    function buildRows(report) {
        return [
            {
                key: "net-profit",
                label: "\u6de8\u5229",
                theory: report.theory.totalNet,
                actual: report.actual.totalNet,
                type: "money",
                description: "\u4ea4\u6613\u6b77\u53f2\u5168\u90e8\u52a0\u7e3d\u5f8c\u7684\u7d50\u679c\uff0c\u542b\u7406\u8ad6\u8207\u542b\u6ed1\u50f9\u5169\u500b\u7248\u672c\u3002",
            },
            {
                key: "return-pct",
                label: "\u5831\u916c\u7387",
                theory: report.theory.totalReturnPct,
                actual: report.actual.totalReturnPct,
                type: "percent",
                description: "\u4ee5\u672c\u91d1\u70ba\u5206\u6bcd\uff0c\u89c0\u5bdf\u7b56\u7565\u6700\u7d42\u8cc7\u91d1\u6210\u9577\u5e45\u5ea6\u3002",
            },
            {
                key: "trade-count",
                label: "\u4ea4\u6613\u6b21\u6578",
                theory: report.theory.count,
                actual: report.actual.count,
                type: "count",
                description: "\u5b8c\u6574\u5e73\u5009\u7684\u4ea4\u6613\u56de\u5408\u7e3d\u6578\u3002",
            },
            {
                key: "win-rate",
                label: "\u52dd\u7387",
                theory: report.theory.winRate * 100,
                actual: report.actual.winRate * 100,
                type: "percent",
                description: "\u7372\u5229\u56de\u5408\u6578\u4f54\u7e3d\u4ea4\u6613\u6578\u7684\u6bd4\u4f8b\u3002",
            },
            {
                key: "avg-trade",
                label: "\u5e73\u5747\u55ae\u7b46",
                theory: report.theory.averageTrade,
                actual: report.actual.averageTrade,
                type: "money",
                description: "\u7e3d\u6de8\u5229\u9664\u4ee5\u4ea4\u6613\u6b21\u6578\uff0c\u89c0\u5bdf\u55ae\u7b46\u671f\u671b\u503c\u3002",
            },
            {
                key: "avg-winner",
                label: "\u5e73\u5747\u8d0f\u5bb6",
                theory: report.theory.averageWinner,
                actual: report.actual.averageWinner,
                type: "money",
                description: "\u53ea\u770b\u8cfa\u9322\u4ea4\u6613\u6642\uff0c\u55ae\u7b46\u5e73\u5747\u80fd\u8ca2\u737b\u591a\u5c11\u3002",
            },
            {
                key: "avg-loser",
                label: "\u5e73\u5747\u8f38\u5bb6",
                theory: report.theory.averageLoser,
                actual: report.actual.averageLoser,
                type: "money",
                description: "\u53ea\u770b\u8ce0\u9322\u4ea4\u6613\u6642\uff0c\u55ae\u7b46\u5e73\u5747\u56de\u64a4\u591a\u5c11\u3002",
            },
            {
                key: "profit-factor",
                label: "\u7372\u5229\u56e0\u5b50",
                theory: report.theory.profitFactor,
                actual: report.actual.profitFactor,
                type: "ratio",
                description: "\u7e3d\u7372\u5229 \u00f7 \u7e3d\u8667\u640d\u7d55\u5c0d\u503c\uff0c\u5927\u65bc 1 \u8868\u793a\u7b56\u7565\u6574\u9ad4\u4ecd\u7136\u6709\u6b63\u512a\u52e2\u3002",
            },
            {
                key: "day-max",
                label: "\u6700\u5927\u55ae\u65e5\u7372\u5229",
                theory: report.theory.dayMax,
                actual: report.actual.dayMax,
                type: "money",
                description: "\u4ee5\u51fa\u5834\u65e5\u7d71\u8a08\uff0c\u5355\u4e00\u65e5\u6700\u597d\u7684\u7372\u5229\u91d1\u984d\u3002",
            },
            {
                key: "day-min",
                label: "\u6700\u5927\u55ae\u65e5\u8667\u640d",
                theory: report.theory.dayMin,
                actual: report.actual.dayMin,
                type: "money",
                description: "\u4ee5\u51fa\u5834\u65e5\u7d71\u8a08\uff0c\u5355\u4e00\u65e5\u6700\u5dee\u7684\u7372\u5229\u91d1\u984d\u3002",
            },
            {
                key: "equity-high",
                label: "\u7d2f\u7a4d\u9ad8\u9ede",
                theory: report.theory.cumulativeHigh,
                actual: report.actual.cumulativeHigh,
                type: "money",
                description: "\u7531\u671f\u521d\u958b\u59cb\u7d2f\u52a0\u5f8c\uff0c\u6b77\u53f2\u4e0a\u5230\u904e\u7684\u6700\u9ad8\u6de8\u5229\u6c34\u4f4d\u3002",
            },
            {
                key: "max-drawdown",
                label: "\u6700\u5927\u56de\u64a4\u91d1\u984d",
                theory: -report.theory.maxDrawdown,
                actual: -report.actual.maxDrawdown,
                type: "money",
                description: "\u7531\u7d2f\u7a4d\u9ad8\u9ede\u56de\u843d\u5230\u4f4e\u9ede\u6642\uff0c\u51fa\u73fe\u7684\u6700\u5927\u91d1\u984d\u5dee\u3002",
            },
            {
                key: "fee-total",
                label: "\u624b\u7e8c\u8cbb",
                theory: -report.totals.fee,
                actual: -report.totals.fee,
                type: "money",
                description: "\u4f9d\u9810\u8a2d\u55ae\u908a\u624b\u7e8c\u8cbb\u4f30\u7b97\u7684\u7d2f\u8a08\u6210\u672c\u3002",
            },
            {
                key: "tax-total",
                label: "\u4ea4\u6613\u7a05",
                theory: -report.totals.tax,
                actual: -report.totals.tax,
                type: "money",
                description: "\u4f9d\u5951\u7d04\u91d1\u984d\u8207\u7a05\u7387\u4f30\u7b97\u7684\u7d2f\u8a08\u6210\u672c\u3002",
            },
            {
                key: "slip-total",
                label: "\u6ed1\u50f9\u6210\u672c",
                theory: 0,
                actual: -report.totals.slippage,
                type: "money",
                description: "\u4f9d\u767b\u5165\u6642\u8f38\u5165\u7684\u55ae\u908a\u6ed1\u9ede\u4f30\u7b97\uff0c\u53ea\u6703\u51fa\u73fe\u5728\u542b\u6ed1\u50f9\u7248\u672c\u3002",
            },
        ];
    }

    function buildReport(rawTrades, userConfig, options) {
        const config = normalizeConfig(userConfig);
        const safeTrades = Array.isArray(rawTrades) ? rawTrades : [];
        const authorityPnls = options && Array.isArray(options.authorityPnls)
            ? options.authorityPnls
            : null;
        const details = safeTrades.map(function (trade, index) {
            return buildTradeDetail(trade, config, authorityPnls ? authorityPnls[index] : null);
        });

        const theory = buildStats(details, "theoryPnl", config.capital);
        const actual = buildStats(details, "actualPnl", config.capital);
        const totals = {
            fee: round2(details.reduce(function (sum, detail) { return sum + Number(detail.fee || 0); }, 0)),
            tax: round2(details.reduce(function (sum, detail) { return sum + Number(detail.tax || 0); }, 0)),
            slippage: round2(details.reduce(function (sum, detail) { return sum + Number(detail.slipCost || 0); }, 0)),
        };

        return {
            config: config,
            details: details,
            theory: theory,
            actual: actual,
            totals: totals,
            summary: {
                theoryNet: theory.totalNet,
                actualNet: actual.totalNet,
                tradeCount: actual.count,
                theoryReturnPct: theory.totalReturnPct,
                actualReturnPct: actual.totalReturnPct,
            },
            annualReturns: actual.annualReturns,
            rows: buildRows({ theory: theory, actual: actual, totals: totals }),
        };
    }

    function buildSimulationReport(trades, userConfig) {
        return buildReport(trades, userConfig, null);
    }

    function buildXqAuthorityReport(trades, userConfig) {
        return buildReport(trades, userConfig, {
            authorityPnls: deriveAuthorityPnls(trades),
        });
    }

    function compareReports(left, right) {
        if (!left || !right) {
            return null;
        }

        return {
            theoryNetDiff: round1(Number(left.theory.totalNet || 0) - Number(right.theory.totalNet || 0)),
            actualNetDiff: round1(Number(left.actual.totalNet || 0) - Number(right.actual.totalNet || 0)),
            tradeCountDiff: Number(left.actual.count || 0) - Number(right.actual.count || 0),
            theoryReturnDiff: round1(Number(left.theory.totalReturnPct || 0) - Number(right.theory.totalReturnPct || 0)),
            actualReturnDiff: round1(Number(left.actual.totalReturnPct || 0) - Number(right.actual.totalReturnPct || 0)),
        };
    }

    window.__XSFuturesKpi = {
        defaultConfig: DEFAULT_CFG,
        normalizeConfig: normalizeConfig,
        buildSimulationReport: buildSimulationReport,
        buildXqAuthorityReport: buildXqAuthorityReport,
        compareReports: compareReports,
    };
}());
