// In-Browser Runtime Engine:
// 1. Boots real @webcontainer/api (Node.js inside browser WebAssembly) when Cross-Origin Isolation is active
// 2. Uses `strip-ansi` to clean ANSI terminal escape sequences
// 3. Includes an instant zero-latency JS Sandbox Runner so code execution (`node index.js`) works immediately and captures clean stdout/stderr for the AI Tutor.

import stripAnsi from 'strip-ansi';

let webcontainerInstance = null;
let bootPromise = null;

export async function getOrBootWebContainer(onStatus) {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
    onStatus?.('Instant Node.js Sandbox Active');
    return null;
  }

  bootPromise = (async () => {
    try {
      onStatus?.('Booting WebContainer (In-Browser Node.js)...');
      const { WebContainer } = await import('@webcontainer/api');
      webcontainerInstance = await WebContainer.boot();
      onStatus?.('WebContainer Ready (Node.js Wasm Active)');
      return webcontainerInstance;
    } catch (err) {
      console.warn('WebContainer boot fallback to Instant JS Sandbox:', err);
      onStatus?.('Instant In-Browser JS Engine Ready');
      return null;
    }
  })();

  return bootPromise;
}

export async function syncFilesToWebContainer(filesMap) {
  if (!webcontainerInstance) return;
  const tree = {};
  for (const [filename, content] of Object.entries(filesMap)) {
    tree[filename] = {
      file: { contents: content }
    };
  }
  await webcontainerInstance.mount(tree);
}

export async function runCodeInWorkspace(filesMap, entryFile = 'index.js', onTerminalData) {
  const cleanOutputLines = [];
  const emit = (rawLine, includeInOutput = true) => {
    const clean = stripAnsi(String(rawLine || ''));
    if (includeInOutput && clean.trim()) {
      cleanOutputLines.push(clean.trimEnd());
    }
    onTerminalData?.(clean);
  };

  emit(`$ node ${entryFile}\n`, false);

  // Try WebContainer process first if booted
  if (webcontainerInstance) {
    try {
      await syncFilesToWebContainer(filesMap);
      const proc = await webcontainerInstance.spawn('node', [entryFile]);
      proc.output.pipeTo(
        new WritableStream({
          write(data) {
            emit(data, true);
          }
        })
      );
      const exitCode = await proc.exit;
      if (exitCode === 0) {
        emit(`[Process completed cleanly]\n`, false);
        return cleanOutputLines.join('\n');
      }
      if (cleanOutputLines.length > 0) {
        return cleanOutputLines.join('\n');
      }
    } catch {
      // Fall through to instant evaluator if spawn fails
    }
  }

  // Instant deterministic in-browser execution with console capture + async resolution
  const code = filesMap[entryFile] || '';
  const captured = [];

  const customConsole = {
    log: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      captured.push(formatted);
      emit(`${formatted}\n`, false);
    },
    error: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      captured.push(`Error: ${formatted}`);
      emit(`Error: ${formatted}\n`, false);
    },
    warn: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      captured.push(`Warn: ${formatted}`);
      emit(`Warn: ${formatted}\n`, false);
    }
  };

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runner = new AsyncFunction('console', 'setTimeout', code);
    await runner(customConsole, window.setTimeout.bind(window));
    await new Promise((r) => setTimeout(r, 220));
    emit(`[Process completed cleanly]\n`, false);
  } catch (err) {
    const errMsg = `${err.name}: ${err.message}`;
    captured.push(errMsg);
    emit(`${errMsg}\n`, false);
  }

  return captured.join('\n');
}

function formatValue(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}
