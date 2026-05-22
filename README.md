# Log Analyzer CLI

A self-contained command-line utility built to stream server log files, handle multi-format config changes gracefully, and extract performance metrics for on-call engineers.

## How To Run

### Prerequisite
Make sure you have [Node.js](https://nodejs.org) installed (v18 or higher recommended).

### 1. Set Up Mock Data
Generate a test log file containing normal entries, mixed JSON data, and bad stack fragments:
```bash
node scripts/generate_logs.js
```
This produces a `sample.log` file in your root workspace folder.

### 2. Analyze Logs
To run diagnostics and display the telemetry readout in your terminal console:
```bash
node analyzer.js sample.log
```

### 3. Export Diagnostics Report
To process the text entries and export an isolated copy of the written findings to an external tracking file:
```bash
node analyzer.js sample.log performance_report.txt
```
