const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Get file path and optional export flag from command line arguments
const args = process.argv.slice(2);
const logFileArg = args[0];
const exportFileArg = args[1];

if (!logFileArg) {
  console.error("Error: Missing log file path.");
  console.log("Usage: node analyzer.js <path-to-log-file> [optional-export-file.txt]");
  process.exit(1);
}

async function processLogs() {
  const targetPath = path.resolve(logFileArg);
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: File not found at ${targetPath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(targetPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let totalLines = 0;
  let successLines = 0;
  let malformedLines = 0;
  
  const endpointData = {};
  const statusCodes = {};

  for await (const line of rl) {
    totalLines++;
    let parsed = null;
    const trimmed = line.trim();

    if (!trimmed) {
      malformedLines++;
      continue;
    }

    // 1. Check for JSON lines
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        // Bad JSON syntax string falls through
      }
    } else {
      // 2. Fallback to Regex for standard configurations
      const regex = /^(\S+)\s+(\S+)\s+([A-Z]+)\s+(\/\S*)\s+(\d{3}|-)\s+(\d+(?:ms|s)?)/;
      const match = trimmed.match(regex);

      if (match) {
        parsed = {
          timestamp: match[1],
          ip: match[2],
          method: match[3],
          path: match[4],
          statusCode: match[5],
          responseTime: match[6]
        };
      }
    }

    // If it didn't pass JSON or Regex, flag as anomaly line
    if (!parsed) {
      malformedLines++;
      continue;
    }

    successLines++;

    // --- DATA NORMALIZATION ---
    let ms = 0;
    if (parsed.responseTime) {
      const timeStr = String(parsed.responseTime);
      if (timeStr.endsWith('ms')) {
        ms = parseFloat(timeStr);
      } else if (timeStr.endsWith('s')) {
        ms = parseFloat(timeStr) * 1000;
      } else {
        ms = parseFloat(timeStr) || 0;
      }
    }

    const code = parsed.statusCode === '-' ? 'MISSING' : parsed.statusCode;

    // --- STATS ACCUMULATION ---
    statusCodes[code] = (statusCodes[code] || 0) + 1;

    const routeKey = `${parsed.method} ${parsed.path}`;
    if (!endpointData[routeKey]) {
      endpointData[routeKey] = { count: 0, totalTime: 0, maxTime: 0 };
    }
    endpointData[routeKey].count++;
    endpointData[routeKey].totalTime += ms;
    if (ms > endpointData[routeKey].maxTime) {
      endpointData[routeKey].maxTime = ms;
    }
  }

  // --- GENERATING THE REPORT CONTENT ---
  let output = "";
  output += "=================================================\n";
  output += "       ON-CALL LOG ANALYZER DIAGNOSTICS          \n";
  output += "=================================================\n";
  output += "[!] SYSTEM INSIGHTS:\n";
  output += `    • Total Lines Scanned: ${totalLines}\n`;
  output += `    • Healthy Parses:     ${successLines}\n`;
  output += `    • Anomalies/Skipped:  ${malformedLines} (${((malformedLines/totalLines)*100).toFixed(1)}%)\n\n`;
  
  output += "[+] STATUS CODE DISTRIBUTION:\n";
  Object.keys(statusCodes).forEach(code => {
    output += `    • ${code}: ${statusCodes[code]} requests\n`;
  });
  output += "\n";

  output += "[-] TOP 5 SLOWEST ENDPOINTS (AVG):\n";
  const sortedEndpoints = Object.keys(endpointData)
    .map(route => {
      const data = endpointData[route];
      return {
        route,
        avg: data.totalTime / data.count,
        max: data.maxTime,
        count: data.count
      };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  sortedEndpoints.forEach((ep, idx) => {
    let alertTag = "[NORMAL]";
    if (ep.avg > 500) alertTag = "[CRITICAL]";
    else if (ep.avg > 200) alertTag = "[WARNING]";

    output += `    ${idx + 1}. ${ep.route.padEnd(25)} ${alertTag}\n`;
    output += `       Calls: ${ep.count} | Avg: ${ep.avg.toFixed(2)}ms | Max: ${ep.max}ms\n`;
  });
  output += "=================================================\n";

  // Print report directly to terminal console
  console.log(output);

  // Write file export if the user requested it
  if (exportFileArg) {
    const exportPath = path.resolve(exportFileArg);
    fs.writeFileSync(exportPath, output, 'utf8');
    console.log(`[Success] Saved clean copy of diagnostics text to: ${exportPath}\n`);
  }
}

processLogs().catch(err => {
  console.error("Fatal parsing runtime failure:", err);
});
