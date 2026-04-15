(function () {
    const ACTIONS = {
        longEntry: "\u65b0\u8cb7",
        shortEntry: "\u65b0\u8ce3",
        longExit: "\u5e73\u8ce3",
        shortExit: "\u5e73\u8cb7",
        forceExit: "\u5f37\u5236\u5e73\u5009",
    };
    const XQ_TRADE_CSV_HEADER = [
        "\u5546\u54c1\u540d\u7a31",
        "\u5546\u54c1\u4ee3\u78bc",
        "\u5e8f\u865f",
        "\u9032\u5834\u6642\u9593",
        "\u9032\u5834\u65b9\u5411",
        "\u9032\u5834\u50f9\u683c",
        "\u51fa\u5834\u6642\u9593",
        "\u51fa\u5834\u65b9\u5411",
        "\u51fa\u5834\u50f9\u683c",
        "\u6301\u6709\u5340\u9593",
        "\u4ea4\u6613\u6578\u91cf",
        "\u7372\u5229\u91d1\u984d",
        "\u5831\u916c\u7387",
        "\u7d2f\u8a08\u7372\u5229\u91d1\u984d",
        "\u7d2f\u8a08\u5831\u916c\u7387",
        "\u9032\u5834\u8a0a\u606f",
        "\u51fa\u5834\u8a0a\u606f",
    ];
    const DEFAULT_FORCE_EXIT_TIME = "131200";

    function normalizeNewlines(text) {
        return String(text || "")
            .replace(/^\uFEFF/, "")
            .replace(/\r\n?/g, "\n");
    }

    function round1(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
    }

    function toNumberOrNull(raw) {
        const cleaned = String(raw == null ? "" : raw).trim().replace(/,/g, "");
        if (!cleaned) {
            return null;
        }
        const value = Number(cleaned);
        return Number.isFinite(value) ? value : null;
    }

    function lowerFileExt(name) {
        const match = String(name || "").match(/(\.[^.]+)$/);
        return match ? match[1].toLowerCase() : "";
    }

    function splitDelimitedLine(line, delimiter) {
        const cells = [];
        let current = "";
        let insideQuote = false;

        for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            const nextChar = line[index + 1];

            if (char === "\"") {
                if (insideQuote && nextChar === "\"") {
                    current += "\"";
                    index += 1;
                } else {
                    insideQuote = !insideQuote;
                }
                continue;
            }

            if (char === delimiter && !insideQuote) {
                cells.push(current.trim());
                current = "";
                continue;
            }

            current += char;
        }

        cells.push(current.trim());
        return cells;
    }

    function detectDelimiter(line) {
        return String(line || "").includes("\t") ? "\t" : ",";
    }

    function parseCsvText(text) {
        const lines = normalizeNewlines(text)
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(Boolean);

        if (!lines.length) {
            return { header: [], rows: [] };
        }

        const delimiter = detectDelimiter(lines[0]);

        return {
            header: splitDelimitedLine(lines[0], delimiter).map(function (value) { return String(value || "").trim(); }),
            rows: lines.slice(1).map(function (line, index) {
                return {
                    lineNumber: index + 2,
                    values: splitDelimitedLine(line, delimiter),
                    raw: line,
                };
            }),
        };
    }

    function headerMatches(actualHeader, expectedHeader) {
        if (actualHeader.length !== expectedHeader.length) {
            return false;
        }
        for (let index = 0; index < expectedHeader.length; index += 1) {
            if (String(actualHeader[index] || "").trim() !== expectedHeader[index]) {
                return false;
            }
        }
        return true;
    }

    function replacementPenalty(text) {
        const matches = String(text || "").match(/\uFFFD/g);
        return matches ? matches.length : 0;
    }

    function scoreDecodedText(text) {
        let score = -replacementPenalty(text) * 100;
        if (String(text || "").includes(XQ_TRADE_CSV_HEADER[0]) && String(text || "").includes(XQ_TRADE_CSV_HEADER[3])) {
            score += 1000;
        }
        if (/BeginTime=.*EndTime=/m.test(String(text || ""))) {
            score += 200;
        }
        if (String(text || "").includes(ACTIONS.longEntry) || String(text || "").includes(ACTIONS.shortEntry)) {
            score += 100;
        }
        if (/^\d{8}\s+\d{6}\s+/m.test(String(text || ""))) {
            score += 20;
        }
        return score;
    }

    function decodeFileBuffer(buffer) {
        const candidates = ["utf-8", "big5", "utf-16le", "utf-16be"];
        let best = {
            encoding: "utf-8",
            text: new TextDecoder("utf-8").decode(buffer),
            score: -Infinity,
        };

        candidates.forEach(function (encoding) {
            try {
                const decoded = new TextDecoder(encoding).decode(buffer);
                const score = scoreDecodedText(decoded);
                if (score > best.score) {
                    best = {
                        encoding: encoding,
                        text: decoded,
                        score: score,
                    };
                }
            } catch {
                // Skip unsupported encodings.
            }
        });

        return {
            encoding: best.encoding,
            text: normalizeNewlines(best.text),
        };
    }

    async function readUploadedFiles(input) {
        const files = Array.from(input && input.files ? input.files : []);
        return Promise.all(files.map(async function (file) {
            const buffer = await file.arrayBuffer();
            const decoded = decodeFileBuffer(buffer);
            return {
                name: file.name,
                ext: lowerFileExt(file.name),
                encoding: decoded.encoding,
                text: decoded.text,
            };
        }));
    }

    function looksLikeXqTradeCsv(text, fileName) {
        const parsed = parseCsvText(text);
        if (headerMatches(parsed.header, XQ_TRADE_CSV_HEADER)) {
            return true;
        }
        const ext = lowerFileExt(fileName);
        return ext === ".csv"
            && parsed.header.includes("\u9032\u5834\u6642\u9593")
            && parsed.header.includes("\u51fa\u5834\u6642\u9593")
            && parsed.header.includes("\u7372\u5229\u91d1\u984d")
            && parsed.header.includes("\u7d2f\u8a08\u5831\u916c\u7387");
    }

    function parseTradeTimestamp(raw) {
        const cleaned = String(raw || "")
            .trim()
            .replace(/[\/:\-\s]/g, "");
        if (/^\d{12}$/.test(cleaned)) {
            return cleaned + "00";
        }
        if (/^\d{14}$/.test(cleaned)) {
            return cleaned;
        }
        return null;
    }

    function resolveForceExitTime(raw) {
        const digits = String(raw == null ? "" : raw).replace(/\D/g, "");
        if (!digits) {
            return DEFAULT_FORCE_EXIT_TIME;
        }
        return digits.padStart(6, "0").slice(-6);
    }

    function toEventPrice(raw) {
        const value = toNumberOrNull(raw);
        return value === null ? null : Math.round(Number(value));
    }

    function buildIndicatorTxt(headerText, events) {
        const lines = events.map(function (event) {
            return event.ts + " " + event.price + " " + event.action;
        });

        const header = String(headerText || "").trim();
        if (header) {
            return [header].concat(lines).join("\n");
        }

        return lines.join("\n");
    }

    function inferExitAction(options) {
        const rawExitDirection = String(options.rawExitDirection || "").trim();
        const rawExitMessage = String(options.rawExitMessage || "").trim();
        const exitTs = String(options.exitTs || "");
        const side = options.side;
        const forceExitTime = resolveForceExitTime(options.forceExitTime);

        if (rawExitMessage.includes(ACTIONS.forceExit) || rawExitDirection.includes("\u5f37\u5236")) {
            return ACTIONS.forceExit;
        }

        if (exitTs && exitTs.slice(8, 14) === forceExitTime) {
            return ACTIONS.forceExit;
        }

        return side === "long" ? ACTIONS.longExit : ACTIONS.shortExit;
    }

    function inferCapitalBasis(trades, fallbackCapital) {
        const safeFallback = Math.max(1, Number(fallbackCapital) || 1000000);
        if (!trades.length) {
            return safeFallback;
        }
        const lastTrade = trades[trades.length - 1];
        if (Number.isFinite(lastTrade.accumProfit) && Number.isFinite(lastTrade.accumReturn) && Math.abs(lastTrade.accumReturn) > 1e-9) {
            return Math.abs(lastTrade.accumProfit / lastTrade.accumReturn);
        }
        return safeFallback;
    }

    function buildAnnualReturns(trades, capitalBasis) {
        const annualProfitMap = new Map();
        trades.forEach(function (trade) {
            const year = String(trade.exitTs || "").slice(0, 4);
            if (!year) {
                return;
            }
            annualProfitMap.set(year, (annualProfitMap.get(year) || 0) + Number(trade.pnlCurrency || 0));
        });

        const exitYears = Array.from(annualProfitMap.keys()).sort();
        const lastYear = exitYears.length
            ? Number(exitYears[exitYears.length - 1])
            : new Date().getFullYear();
        const annualReturns = [];

        for (let year = lastYear - 5; year <= lastYear; year += 1) {
            const pnl = annualProfitMap.get(String(year)) || 0;
            annualReturns.push({
                year: year,
                value: round1((pnl / capitalBasis) * 100),
            });
        }

        return annualReturns;
    }

    function buildMetricsFromTrades(trades, fallbackCapital) {
        if (!trades.length) {
            return {
                totalReturn: null,
                maxDrawdown: null,
                tradeCount: null,
                annualReturns: [{ year: "\u5f85\u9a57\u8b49", value: null }],
                capitalBasis: Math.max(1, Number(fallbackCapital) || 1000000),
                totalPnl: 0,
            };
        }

        const capitalBasis = inferCapitalBasis(trades, fallbackCapital);
        const lastTrade = trades[trades.length - 1];
        const totalPnl = Number.isFinite(lastTrade.accumProfit)
            ? Number(lastTrade.accumProfit)
            : trades.reduce(function (sum, trade) { return sum + Number(trade.pnlCurrency || 0); }, 0);
        const totalReturn = Number.isFinite(lastTrade.accumReturn)
            ? Number(lastTrade.accumReturn) * 100
            : (totalPnl / capitalBasis) * 100;

        let peakNav = 1;
        let maxDrawdown = 0;
        trades.forEach(function (trade) {
            const nav = Number.isFinite(trade.accumReturn)
                ? 1 + Number(trade.accumReturn)
                : 1 + (Number(trade.accumProfit || 0) / capitalBasis);
            if (nav > peakNav) {
                peakNav = nav;
            }
            const drawdown = peakNav > 0 ? ((nav / peakNav) - 1) * 100 : 0;
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        return {
            totalReturn: round1(totalReturn),
            maxDrawdown: round1(maxDrawdown),
            tradeCount: trades.length,
            annualReturns: buildAnnualReturns(trades, capitalBasis),
            capitalBasis: capitalBasis,
            totalPnl: totalPnl,
        };
    }

    function parseXqTradeCsvText(text, settings) {
        const parsed = parseCsvText(text);
        if (!headerMatches(parsed.header, XQ_TRADE_CSV_HEADER)) {
            throw new Error("XQ CSV \u6b04\u4f4d\u683c\u5f0f\u4e0d\u7b26\u5408\u4ea4\u6613\u660e\u7d30\u532f\u51fa\u683c\u5f0f\u3002");
        }

        const trades = [];
        const events = [];
        const issues = [];

        const forceExitTime = resolveForceExitTime(settings && settings.forceExitTime);
        parsed.rows.forEach(function (row) {
            if (row.values.length !== XQ_TRADE_CSV_HEADER.length) {
                issues.push("XQ CSV \u7b2c " + row.lineNumber + " \u884c\u6b04\u4f4d\u6578\u4e0d\u6b63\u78ba\u3002");
                return;
            }

            const entryTs = parseTradeTimestamp(row.values[3]);
            const exitTs = parseTradeTimestamp(row.values[6]);
            const entryDirection = String(row.values[4] || "").trim();
            const exitDirection = String(row.values[7] || "").trim();
            const entryPrice = toNumberOrNull(row.values[5]);
            const exitPrice = toNumberOrNull(row.values[8]);
            const eventEntryPrice = toEventPrice(row.values[5]);
            const eventExitPrice = toEventPrice(row.values[8]);
            const quantity = toNumberOrNull(row.values[10]);
            const pnlCurrency = toNumberOrNull(row.values[11]);
            const returnRate = toNumberOrNull(row.values[12]);
            const accumProfit = toNumberOrNull(row.values[13]);
            const accumReturn = toNumberOrNull(row.values[14]);
            const side = entryDirection.includes("\u8cb7")
                ? "long"
                : (entryDirection.includes("\u8ce3") ? "short" : null);

            if (!entryTs || !exitTs || side === null || entryPrice === null || exitPrice === null || pnlCurrency === null) {
                issues.push("XQ CSV \u7b2c " + row.lineNumber + " \u884c\u542b\u6709\u7121\u6cd5\u89e3\u6790\u7684\u4ea4\u6613\u6b04\u4f4d\u3002");
                return;
            }

            const entryAction = side === "long" ? ACTIONS.longEntry : ACTIONS.shortEntry;
            const exitAction = inferExitAction({
                rawExitDirection: exitDirection,
                rawExitMessage: row.values[16],
                exitTs: exitTs,
                side: side,
                forceExitTime: forceExitTime,
            });
            const trade = {
                side: side,
                entryTs: entryTs,
                exitTs: exitTs,
                entryPrice: Number(entryPrice),
                exitPrice: Number(exitPrice),
                quantity: quantity === null ? 1 : Number(quantity),
                pnlCurrency: Number(pnlCurrency),
                returnRate: returnRate,
                accumProfit: accumProfit,
                accumReturn: accumReturn,
                entryAction: entryAction,
                exitAction: exitAction,
            };

            trades.push(trade);
            events.push({ ts: entryTs, price: eventEntryPrice, action: entryAction });
            events.push({ ts: exitTs, price: eventExitPrice, action: exitAction });
        });

        if (!trades.length) {
            throw new Error("XQ CSV \u6c92\u6709\u53ef\u7528\u7684\u4ea4\u6613\u660e\u7d30\u3002");
        }

        return {
            trades: trades,
            events: events,
            issues: issues,
            metrics: buildMetricsFromTrades(trades, settings && settings.capital),
            forceExitTime: forceExitTime,
            indicatorTxt: buildIndicatorTxt(settings && settings.headerText, events),
        };
    }

    window.__XSXqUpload = {
        actions: ACTIONS,
        defaultForceExitTime: DEFAULT_FORCE_EXIT_TIME,
        looksLikeXqTradeCsv: looksLikeXqTradeCsv,
        parseXqTradeCsvText: parseXqTradeCsvText,
        readUploadedFiles: readUploadedFiles,
    };
}());
