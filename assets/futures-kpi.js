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
            entryAction: trade && trade.entryAction ? String(trade.entryAction) : "",
            exitAction: trade && trade.exitAction ? String(trade.exitAction) : "",
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

    function parseDetailDate(value) {
        const digits = String(value || "").replace(/\D+/g, "");
        if (digits.length < 8) {
            return null;
        }
        const year = Number(digits.slice(0, 4));
        const month = Number(digits.slice(4, 6)) - 1;
        const day = Number(digits.slice(6, 8));
        const hour = digits.length >= 10 ? Number(digits.slice(8, 10)) : 0;
        const minute = digits.length >= 12 ? Number(digits.slice(10, 12)) : 0;
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
            return null;
        }
        return new Date(year, month, day, hour, minute, 0, 0);
    }

    function buildIsoWeekKey(date) {
        if (!(date instanceof Date)) {
            return "";
        }
        const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = utc.getUTCDay() || 7;
        utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
        return utc.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
    }

    function buildStabilityR2(navValues) {
        if (!Array.isArray(navValues) || navValues.length < 3) {
            return null;
        }

        const xs = navValues.map(function (_, index) { return index + 1; });
        const total = navValues.length;
        const sumX = xs.reduce(function (sum, value) { return sum + value; }, 0);
        const sumY = navValues.reduce(function (sum, value) { return sum + value; }, 0);
        const sumXY = xs.reduce(function (sum, value, index) {
            return sum + value * navValues[index];
        }, 0);
        const sumX2 = xs.reduce(function (sum, value) { return sum + value * value; }, 0);
        const meanY = sumY / total;
        const ssTot = navValues.reduce(function (sum, value) {
            return sum + (value - meanY) * (value - meanY);
        }, 0);

        if (!(ssTot > 0)) {
            return null;
        }

        const denominator = total * sumX2 - sumX * sumX;
        if (!(denominator !== 0)) {
            return null;
        }

        const slope = (total * sumXY - sumX * sumY) / denominator;
        const intercept = meanY - slope * (sumX / total);
        const ssRes = navValues.reduce(function (sum, value, index) {
            const expected = slope * xs[index] + intercept;
            return sum + (value - expected) * (value - expected);
        }, 0);

        return 1 - (ssRes / ssTot);
    }

    function buildStats(details, field, config) {
        const safeDetails = Array.isArray(details) ? details : [];
        const capital = Number(config && config.capital) > 0 ? Number(config.capital) : 1;
        const dailyMap = new Map();
        const weeklyMap = new Map();
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
        let maxDrawdownPeakIndex = 0;
        let maxDrawdownTroughIndex = 0;
        let currentPeakIndex = 0;
        let sumSquares = 0;
        let downsideSquares = 0;
        let downsideCount = 0;
        let totalFee = 0;
        let totalTax = 0;
        let totalSlipCost = 0;
        let notionalTraded = 0;
        let totalHoldMinutes = 0;
        let firstExitDate = null;
        let lastExitDate = null;
        const navValues = [];

        safeDetails.forEach(function (detail, index) {
            const pnl = Number(detail && detail[field]);
            if (!Number.isFinite(pnl)) {
                return;
            }

            pnlList.push(pnl);
            totalNet += pnl;
            sumSquares += pnl * pnl;

            if (pnl > 0) {
                winCount += 1;
                grossProfit += pnl;
            } else if (pnl < 0) {
                lossCount += 1;
                grossLoss += pnl;
                downsideSquares += pnl * pnl;
                downsideCount += 1;
            }

            const dayKey = String(detail && detail.exitTs || "").slice(0, 8);
            if (dayKey) {
                dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + pnl);
            }

            const exitDate = parseDetailDate(detail && detail.exitTs);
            if (exitDate instanceof Date) {
                const weekKey = buildIsoWeekKey(exitDate);
                if (weekKey) {
                    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + pnl);
                }
                if (!firstExitDate || exitDate < firstExitDate) {
                    firstExitDate = exitDate;
                }
                if (!lastExitDate || exitDate > lastExitDate) {
                    lastExitDate = exitDate;
                }
            }

            const entryDate = parseDetailDate(detail && detail.entryTs);
            if (entryDate instanceof Date && exitDate instanceof Date && exitDate >= entryDate) {
                totalHoldMinutes += (exitDate - entryDate) / 60000;
            }

            const quantity = Math.max(1, toNumber(detail && detail.quantity, 1));
            const entryPrice = Number(detail && detail.entryPrice);
            if (Number.isFinite(entryPrice)) {
                notionalTraded += entryPrice * Number(config && config.pointValue || 0) * quantity;
            }

            totalFee += Number(detail && detail.fee || 0);
            totalTax += Number(detail && detail.tax || 0);
            if (field === "actualPnl") {
                totalSlipCost += Number(detail && detail.slipCost || 0);
            }

            cumulative += pnl;
            cumulativeHigh = Math.max(cumulativeHigh, cumulative);
            if (cumulative > peak) {
                peak = cumulative;
                currentPeakIndex = index;
            }
            navValues.push(capital + cumulative);

            const drawdown = peak - cumulative;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
                maxDrawdownPeakIndex = currentPeakIndex;
                maxDrawdownTroughIndex = index;
            }
        });

        const dayValues = Array.from(dailyMap.values());
        const weekValues = Array.from(weeklyMap.values());
        const count = pnlList.length;
        const averageWinner = winCount ? (grossProfit / winCount) : 0;
        const averageLoser = lossCount ? (grossLoss / lossCount) : 0;
        const averageTrade = count ? (totalNet / count) : 0;
        const mean = averageTrade;
        const variance = count > 1 ? (sumSquares / count) - mean * mean : 0;
        const volatilityPerTrade = variance > 0 ? Math.sqrt(variance) : 0;
        const sharpeTrade = volatilityPerTrade > 0 ? (mean / volatilityPerTrade) * Math.sqrt(count) : null;
        const downsideDeviation = downsideCount > 0 ? Math.sqrt(downsideSquares / downsideCount) : 0;
        const sortinoTrade = downsideDeviation > 0 ? (mean / downsideDeviation) * Math.sqrt(count) : null;
        const payoffRatio = averageLoser < 0 ? (averageWinner / Math.abs(averageLoser)) : null;
        const expectancy = averageTrade;
        const totalReturnPct = (totalNet / capital) * 100;
        let cagr = null;

        if (firstExitDate && lastExitDate && lastExitDate > firstExitDate) {
            const days = (lastExitDate - firstExitDate) / 86400000;
            const years = days / 365;
            if (years > 0) {
                const finalNav = capital + totalNet;
                const ratio = finalNav / capital;
                if (ratio > 0) {
                    cagr = Math.pow(ratio, 1 / years) - 1;
                }
            }
        }

        const maxDrawdownPct = capital > 0 ? (maxDrawdown / capital) : null;
        const calmar = (cagr != null && maxDrawdownPct > 0)
            ? (cagr / maxDrawdownPct)
            : null;

        let peakNav = 0;
        const ulcerIndex = navValues.length
            ? Math.sqrt(navValues.reduce(function (sum, value) {
                peakNav = Math.max(peakNav, value);
                const ddPct = peakNav > 0 ? (peakNav - value) / peakNav : 0;
                return sum + ddPct * ddPct;
            }, 0) / navValues.length)
            : null;

        const recoveryFactor = maxDrawdown > 0 ? (totalNet / maxDrawdown) : null;
        const sortedPnls = pnlList.slice().sort(function (left, right) { return left - right; });
        const varIndex = sortedPnls.length ? Math.floor((1 - 0.95) * sortedPnls.length) : -1;
        const varLoss = sortedPnls.length
            ? -sortedPnls[Math.min(varIndex, sortedPnls.length - 1)]
            : null;
        let tailSum = 0;
        let tailCount = 0;

        for (let index = 0; index <= varIndex && index < sortedPnls.length; index += 1) {
            tailSum += sortedPnls[index];
            tailCount += 1;
        }

        const cvarLoss = tailCount > 0 ? -(tailSum / tailCount) : null;
        let kellyFraction = null;
        if (payoffRatio != null && payoffRatio > 0 && count > 0) {
            const p = winCount / count;
            const q = 1 - p;
            kellyFraction = p - q / payoffRatio;
        }

        let riskOfRuin = null;
        if (!(variance > 0)) {
            riskOfRuin = null;
        } else if (mean <= 0) {
            riskOfRuin = 1;
        } else {
            const exponent = -2 * mean * capital / variance;
            riskOfRuin = Math.min(1, Math.max(0, Math.exp(exponent)));
        }

        const totalCost = totalFee + totalTax + totalSlipCost;
        const totalGrossAbs = grossProfit + Math.abs(grossLoss);
        const tradingDays = dailyMap.size;
        const tradesPerDay = tradingDays > 0 ? (count / tradingDays) : null;
        const averageHoldMinutes = count > 0 ? (totalHoldMinutes / count) : null;
        const turnover = capital > 0 ? (notionalTraded / capital) : null;
        const costRatio = totalGrossAbs > 0 ? (totalCost / totalGrossAbs) : null;

        return {
            count: count,
            winCount: winCount,
            lossCount: lossCount,
            winRate: count ? (winCount / count) : 0,
            loseRate: count ? (lossCount / count) : 0,
            totalNet: totalNet,
            totalReturnPct: totalReturnPct,
            averageTrade: averageTrade,
            averageWinner: averageWinner,
            averageLoser: averageLoser,
            profitFactor: grossLoss < 0 ? (grossProfit / Math.abs(grossLoss)) : null,
            grossProfit: grossProfit,
            grossLoss: grossLoss,
            maxSingleWin: pnlList.length ? Math.max.apply(null, pnlList) : 0,
            maxSingleLoss: pnlList.length ? Math.min.apply(null, pnlList) : 0,
            dayMax: dayValues.length ? Math.max.apply(null, dayValues) : 0,
            dayMin: dayValues.length ? Math.min.apply(null, dayValues) : 0,
            bestWeekPnl: weekValues.length ? Math.max.apply(null, weekValues) : 0,
            worstWeekPnl: weekValues.length ? Math.min.apply(null, weekValues) : 0,
            cumulativeHigh: cumulativeHigh,
            maxDrawdown: maxDrawdown,
            maxDrawdownPct: maxDrawdownPct,
            riskOfRuin: riskOfRuin,
            volatilityPerTrade: volatilityPerTrade,
            sharpeTrade: sharpeTrade,
            sortinoTrade: sortinoTrade,
            calmar: calmar,
            cagr: cagr,
            ulcerIndex: ulcerIndex,
            recoveryFactor: recoveryFactor,
            timeToRecoveryTrades: maxDrawdownTroughIndex > maxDrawdownPeakIndex ? (maxDrawdownTroughIndex - maxDrawdownPeakIndex) : 0,
            varLoss: varLoss,
            cvarLoss: cvarLoss,
            payoffRatio: payoffRatio,
            expectancy: expectancy,
            kellyFraction: kellyFraction,
            stabilityR2: buildStabilityR2(navValues),
            tradingDays: tradingDays,
            tradesPerDay: tradesPerDay,
            averageHoldMinutes: averageHoldMinutes,
            turnover: turnover,
            totalFee: totalFee,
            totalTax: totalTax,
            totalSlipCost: totalSlipCost,
            totalCost: totalCost,
            costRatio: costRatio,
            annualReturns: buildAnnualReturns(safeDetails, field, capital),
        };
    }

    function buildRows(report) {
        const theory = report.theory || {};
        const actual = report.actual || {};
        const theoryDrawdownPct = Number.isFinite(Number(theory.maxDrawdownPct)) ? Number(theory.maxDrawdownPct) * 100 : null;
        const actualDrawdownPct = Number.isFinite(Number(actual.maxDrawdownPct)) ? Number(actual.maxDrawdownPct) * 100 : null;
        const theoryRiskOfRuinPct = Number.isFinite(Number(theory.riskOfRuin)) ? Number(theory.riskOfRuin) * 100 : null;
        const actualRiskOfRuinPct = Number.isFinite(Number(actual.riskOfRuin)) ? Number(actual.riskOfRuin) * 100 : null;
        const theoryCagrPct = Number.isFinite(Number(theory.cagr)) ? Number(theory.cagr) * 100 : null;
        const actualCagrPct = Number.isFinite(Number(actual.cagr)) ? Number(actual.cagr) * 100 : null;
        const theoryWinRatePct = Number.isFinite(Number(theory.winRate)) ? Number(theory.winRate) * 100 : null;
        const actualWinRatePct = Number.isFinite(Number(actual.winRate)) ? Number(actual.winRate) * 100 : null;
        const theoryLossRatePct = Number.isFinite(Number(theory.loseRate)) ? Number(theory.loseRate) * 100 : null;
        const actualLossRatePct = Number.isFinite(Number(actual.loseRate)) ? Number(actual.loseRate) * 100 : null;
        const theoryCostRatioPct = Number.isFinite(Number(theory.costRatio)) ? Number(theory.costRatio) * 100 : null;
        const actualCostRatioPct = Number.isFinite(Number(actual.costRatio)) ? Number(actual.costRatio) * 100 : null;

        return [
            { key: "maxdd_pct", label: "Max Drawdown %", theory: theoryDrawdownPct, actual: actualDrawdownPct, type: "percentAbs", description: "本金基準下的最大淨值跌幅。" },
            { key: "max-drawdown", label: "Max Drawdown", theory: theory.maxDrawdown, actual: actual.maxDrawdown, type: "moneyAbs", description: "累積淨損益由高點跌到低點的最大金額差。" },
            { key: "risk_ruin", label: "Risk of Ruin", theory: theoryRiskOfRuinPct, actual: actualRiskOfRuinPct, type: "percentAbs", description: "長期耗損到資金歸零的近似機率。" },
            { key: "worst-day", label: "Worst Day PnL", theory: theory.dayMin, actual: actual.dayMin, type: "money", description: "單一出場日加總後最差的一天。" },
            { key: "worst-week", label: "Worst Week PnL", theory: theory.worstWeekPnl, actual: actual.worstWeekPnl, type: "money", description: "以每週最後一天為結算點時最差的一週。" },
            { key: "var-loss", label: "95% VaR", theory: theory.varLoss, actual: actual.varLoss, type: "moneyAbs", description: "95% 信心水準下的單筆損失門檻。" },
            { key: "cvar-loss", label: "95% CVaR", theory: theory.cvarLoss, actual: actual.cvarLoss, type: "moneyAbs", description: "最差 5% 單筆損失的平均值。" },
            { key: "time-to-recovery", label: "Time to Recovery", theory: theory.timeToRecoveryTrades, actual: actual.timeToRecoveryTrades, type: "count", description: "從最大回撤高點到谷底跨越的交易筆數。" },
            { key: "ulcer-index", label: "Ulcer Index", theory: theory.ulcerIndex, actual: actual.ulcerIndex, type: "f4", description: "NAV 路徑下行壓力指標。" },
            { key: "recovery-factor", label: "Recovery Factor", theory: theory.recoveryFactor, actual: actual.recoveryFactor, type: "f2", description: "總淨利相對於最大回撤的回復效率。" },
            { key: "net-profit", label: "Net Profit", theory: theory.totalNet, actual: actual.totalNet, type: "money", description: "整段回測累積後的最終淨利。" },
            { key: "total_return", label: "Total Return", theory: theory.totalReturnPct, actual: actual.totalReturnPct, type: "percent", description: "最終淨利除以本金後的整體報酬率。" },
            { key: "cagr", label: "CAGR", theory: theoryCagrPct, actual: actualCagrPct, type: "percent", description: "以第一筆到最後一筆實際期間推估的複合年化報酬。" },
            { key: "volatility", label: "Trade Volatility", theory: theory.volatilityPerTrade, actual: actual.volatilityPerTrade, type: "moneyAbs", description: "單筆損益標準差。" },
            { key: "sharpe", label: "Sharpe Ratio", theory: theory.sharpeTrade, actual: actual.sharpeTrade, type: "f2", description: "單筆損益均值相對總波動的效率。" },
            { key: "sortino", label: "Sortino Ratio", theory: theory.sortinoTrade, actual: actual.sortinoTrade, type: "f2", description: "只用下行波動衡量的報酬效率。" },
            { key: "calmar", label: "Calmar Ratio", theory: theory.calmar, actual: actual.calmar, type: "f2", description: "年化報酬率相對最大回撤的效率。" },
            { key: "trade-count", label: "Trades", theory: theory.count, actual: actual.count, type: "count", description: "完整開平倉回合數。" },
            { key: "win-count", label: "Win Trades", theory: theory.winCount, actual: actual.winCount, type: "count", description: "淨損益大於零的交易筆數。" },
            { key: "loss-count", label: "Loss Trades", theory: theory.lossCount, actual: actual.lossCount, type: "count", description: "淨損益小於零的交易筆數。" },
            { key: "winrate", label: "Hit Rate", theory: theoryWinRatePct, actual: actualWinRatePct, type: "percent", description: "獲利交易占全部回合的比率。" },
            { key: "loss-rate", label: "Loss Rate", theory: theoryLossRatePct, actual: actualLossRatePct, type: "percent", description: "虧損交易占全部回合的比率。" },
            { key: "avg-trade", label: "Avg Trade PnL", theory: theory.averageTrade, actual: actual.averageTrade, type: "money", description: "每筆交易的平均淨損益。" },
            { key: "avg-winner", label: "Avg Win", theory: theory.averageWinner, actual: actual.averageWinner, type: "money", description: "只計獲利交易時的平均淨損益。" },
            { key: "avg-loser", label: "Avg Loss", theory: theory.averageLoser, actual: actual.averageLoser, type: "money", description: "只計虧損交易時的平均淨損益。" },
            { key: "payoff", label: "Payoff Ratio", theory: theory.payoffRatio, actual: actual.payoffRatio, type: "f2", description: "平均獲利與平均虧損絕對值的比率。" },
            { key: "expectancy", label: "Expectancy", theory: theory.expectancy, actual: actual.expectancy, type: "money", description: "長期平均每筆可期待的淨損益。" },
            { key: "pf", label: "Profit Factor", theory: theory.profitFactor, actual: actual.profitFactor, type: "f2", description: "總獲利除以總虧損絕對值。" },
            { key: "gross-profit", label: "Gross Profit", theory: theory.grossProfit, actual: actual.grossProfit, type: "money", description: "所有賺錢交易加總後的淨利。" },
            { key: "gross-loss", label: "Gross Loss", theory: theory.grossLoss, actual: actual.grossLoss, type: "money", description: "所有賠錢交易加總後的淨利。" },
            { key: "largest-win", label: "Largest Win", theory: theory.maxSingleWin, actual: actual.maxSingleWin, type: "money", description: "單筆交易中最好的獲利。" },
            { key: "largest-loss", label: "Largest Loss", theory: theory.maxSingleLoss, actual: actual.maxSingleLoss, type: "money", description: "單筆交易中最差的虧損。" },
            { key: "kelly", label: "Kelly Fraction", theory: theory.kellyFraction, actual: actual.kellyFraction, type: "f2", description: "依勝率與盈虧比估算的 Kelly 值。" },
            { key: "stability-r2", label: "Equity Stability R2", theory: theory.stabilityR2, actual: actual.stabilityR2, type: "f3", description: "資金曲線的線性穩定度。" },
            { key: "equity-high", label: "Equity High", theory: theory.cumulativeHigh, actual: actual.cumulativeHigh, type: "money", description: "歷史累積淨利曾到過的最高水位。" },
            { key: "best-day", label: "Best Day PnL", theory: theory.dayMax, actual: actual.dayMax, type: "money", description: "單一出場日加總後最好的一天。" },
            { key: "best-week", label: "Best Week PnL", theory: theory.bestWeekPnl, actual: actual.bestWeekPnl, type: "money", description: "以每週最後一天為結算點時最好的一週。" },
            { key: "trading-days", label: "Trading Days", theory: theory.tradingDays, actual: actual.tradingDays, type: "count", description: "有平倉紀錄的實際交易日數。" },
            { key: "trades-per-day", label: "Trades / Day", theory: theory.tradesPerDay, actual: actual.tradesPerDay, type: "f2", description: "每個有交易日平均完成的回合數。" },
            { key: "avg-hold", label: "Avg Holding Time", theory: theory.averageHoldMinutes, actual: actual.averageHoldMinutes, type: "f1", description: "平均持有分鐘數。" },
            { key: "turnover", label: "Turnover", theory: theory.turnover, actual: actual.turnover, type: "f2", description: "名目成交金額相對本金的倍率。" },
            { key: "cost_ratio", label: "Cost Ratio", theory: theoryCostRatioPct, actual: actualCostRatioPct, type: "percentAbs", description: "總交易成本占毛損益的比例。" },
            { key: "fee-total", label: "Total Commission", theory: theory.totalFee, actual: actual.totalFee, type: "moneyAbs", description: "整段回測累積手續費。" },
            { key: "tax-total", label: "Total Tax", theory: theory.totalTax, actual: actual.totalTax, type: "moneyAbs", description: "整段回測累積交易稅。" },
            { key: "slip-total", label: "Slippage Cost", theory: theory.totalSlipCost, actual: actual.totalSlipCost, type: "moneyAbs", description: "依滑點假設估算的累積滑價成本。" },
            { key: "trading-cost", label: "Total Trading Cost", theory: theory.totalCost, actual: actual.totalCost, type: "moneyAbs", description: "手續費、交易稅與滑價的總合。" },
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

        const theory = buildStats(details, "theoryPnl", config);
        const actual = buildStats(details, "actualPnl", config);
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
