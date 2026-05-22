const fs = require('fs');
const path = require('path');

const paths = ['/api/users', '/api/login', '/api/dashboard', '/index.html', '/api/checkout'];
const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const statuses = ['200', '201', '400', '401', '404', '500', '-'];

console.log("Generating test logs...");

function generateFakeLog() {
  const lines = [];
  
  for (let i = 0; i < 5000; i++) {
    const rand = Math.random();

    if (rand > 0.10) {
      const ip = `192.168.1.${Math.floor(Math.random() * 254)}`;
      const method = methods[Math.floor(Math.random() * methods.length)];
      const path = paths[Math.floor(Math.random() * paths.length)];
      const status = statuses[Math.floor(Math.random() * (statuses.length - 1))];
      const ms = Math.floor(Math.random() * 300) + "ms";
      lines.push(`2024-03-15T14:23:01Z ${ip} ${method} ${path} ${status} ${ms}`);
    } 
    else if (rand > 0.05) {
      const jsonLog = {
        timestamp: "2024/03/15 15:22:11",
        ip: "10.0.0.5",
        method: "GET",
        path: "/api/users/internal",
        statusCode: "-",
        responseTime: "0.45s"
      };
      lines.push(JSON.stringify(jsonLog));
    } 
    else {
      if (Math.random() > 0.5) {
        lines.push("Error: NullPointerException at server.auth.login(auth.js:42)");
      } else {
        lines.push("");
      }
    }
  }

  fs.writeFileSync(path.join(__dirname, '../sample.log'), lines.join('\n'));
  console.log("Done! Created 'sample.log' in the root directory.");
}

generateFakeLog();
