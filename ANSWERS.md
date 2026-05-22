# Technical Assessment Answers

### 1. How to run
I used standard Node.js without heavy framework wrappers. 
Steps:
1. Unzip/clone the repository.
2. Run `node scripts/generate_logs.js` to create the test `sample.log` file in the root directory.
3. Run the analyzer command:
   ```bash
   node analyzer.js sample.log
   ```

### 2. Stack choice
I picked vanilla Node.js because it has built-in file streaming modules (`fs` and `readline`). This lets the app open massive log text files line-by-line using `for await` loops without loading the entire 100MB+ file structure straight into system RAM all at once. 

A worse choice would have been vanilla Python without external libraries, because working with mixed regular expressions and parsing JSON strings natively together requires a lot of boilerplates. Another terrible alternative would be a frontend JavaScript app with an HTML upload selector, because big logs easily lock up browser renderer threads and crash the browser entirely.

### 3. One real edge case
My code handles lines where the status code is missing and logged as a dash (`-`). 
* **File:** `analyzer.js`
* **Line Number:** 71
* **Handling:** I write an explicit check: `const code = parsed.statusCode === '-' ? 'MISSING' : parsed.statusCode;`. 
* **What would happen without it:** Without this string intercept, the map object tracking error counts would break, or the metric sorting calculations would output `NaN` values and scramble our final display console results.

### 4. AI usage
I used ChatGPT to help me organize the initial RegEx block match group statement for string splitting, because string manipulation can be highly tedious to map out manually without mistakes. 

* **What I modified:** The AI code generated a regex match string that expected the timestamp format to match exactly standard ISO layout (`YYYY-MM-DD...`). I altered the regex rule match identifiers (`\S+`) to read any non-whitespace characters instead. This made sure that alternative formats using slashes (`2024/03/15`) or shorthand strings didn't break down and bypass our regex pipeline logic filters.

### 5. Honest gap
The current sorting system keeps everything in an active memory map (`endpointData`) to compute averages and maximum request thresholds at the very end of the line streaming loops. If we feed this utility an immense data dump where there are millions of completely randomized, unique URL variations, the memory structure will gradually bloat up and could potentially trigger a Node memory execution crash. To fix this with an extra day, I would dump the streaming items straight into a local database driver like SQLite so the hardware can compute indexes and handle groupings safely.
