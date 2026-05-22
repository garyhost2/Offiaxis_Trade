/**
 * Applies useSafeAreaInsets pattern to all screens that are missing it.
 * Run from: e:\Offiaxis\Offiaxis_Trade\frontend
 *
 * For each file it:
 *  1. Adds: import { useSafeAreaInsets } from 'react-native-safe-area-context';
 *  2. Inserts: const insets = useSafeAreaInsets(); after router/auth hook calls
 *  3. Wraps the first LinearGradient with style={styles.header} to use inline paddingTop
 *  4. For non-tab screens: also adds bottom inset to the root container
 */

const fs = require('fs');
const path = require('path');

const EXTRA_TOP = 12; // content padding below status bar

// Files where the gradient header style name might not be 'header'
// For those we'll still use the same LinearGradient style={styles.header} pattern
const files = [
  { path: 'app/email-login.tsx',        extraTop: 20, isTabScreen: false },
  { path: 'app/signup.tsx',             extraTop: 20, isTabScreen: false },
  { path: 'app/(tabs)/menu.tsx',        extraTop: 12, isTabScreen: true  },
  { path: 'app/(tabs)/projects.tsx',    extraTop: 12, isTabScreen: true  },
  { path: 'app/(tabs)/tracker.tsx',     extraTop: 12, isTabScreen: true  },
  { path: 'app/receipts.tsx',           extraTop: 12, isTabScreen: false },
  { path: 'app/schedule.tsx',           extraTop: 12, isTabScreen: false },
  { path: 'app/settings.tsx',           extraTop: 12, isTabScreen: false },
  { path: 'app/inventory.tsx',          extraTop: 12, isTabScreen: false },
  { path: 'app/profitloss.tsx',         extraTop: 12, isTabScreen: false },
  { path: 'app/site-notes-ai.tsx',      extraTop: 12, isTabScreen: false },
  { path: 'app/knowledge-center.tsx',   extraTop: 12, isTabScreen: false },
  { path: 'app/gallery.tsx',            extraTop: 12, isTabScreen: false },
  { path: 'app/materials.tsx',          extraTop: 12, isTabScreen: false },
  { path: 'app/folder-photos.tsx',      extraTop: 12, isTabScreen: false },
  { path: 'app/portfolio-photos.tsx',   extraTop: 12, isTabScreen: false },
  { path: 'app/project-gallery.tsx',    extraTop: 12, isTabScreen: false },
];

let totalChanged = 0;
let totalSkipped = 0;

for (const file of files) {
  const fullPath = path.join(__dirname, '..', file.path);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${file.path}`);
    totalSkipped++;
    continue;
  }

  let src = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // ── 1. Add useSafeAreaInsets import ────────────────────────────────────────
  if (!src.includes('useSafeAreaInsets')) {
    if (src.includes("from 'react-native-safe-area-context'")) {
      // Already has an import from that package — add useSafeAreaInsets to it
      src = src.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react-native-safe-area-context'/,
        (match, inner) => {
          const trimmed = inner.trim();
          return `import { ${trimmed}, useSafeAreaInsets } from 'react-native-safe-area-context'`;
        }
      );
    } else {
      // Inject a new import after the last import block line
      const lastImportIdx = (() => {
        const lines = src.split('\n');
        let last = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) last = i;
        }
        return last;
      })();
      const lines = src.split('\n');
      lines.splice(lastImportIdx + 1, 0, "import { useSafeAreaInsets } from 'react-native-safe-area-context';");
      src = lines.join('\n');
    }
    changed = true;
  }

  // ── 2. Add const insets = useSafeAreaInsets(); inside component ────────────
  if (!src.includes('useSafeAreaInsets()')) {
    // Find first "const router = useRouter();" or "const { " hook line or first useState
    // Strategy: find "export default function" and insert after its opening brace
    const fnMatch = src.match(/export default function \w+\(\)\s*\{/);
    if (fnMatch) {
      const insertAfter = fnMatch[0];
      src = src.replace(
        insertAfter,
        `${insertAfter}\n  const insets = useSafeAreaInsets();`
      );
      changed = true;
    }
  }

  // ── 3. Fix LinearGradient header to use insets.top ─────────────────────────
  // Pattern: style={styles.header} on a LinearGradient
  // Replace with: style={[styles.header, { paddingTop: insets.top + EXTRA }]}
  if (src.includes('style={styles.header}') && !src.includes('insets.top')) {
    src = src.replace(
      /(<LinearGradient[^>]*?)\bstyle=\{styles\.header\}/s,
      `$1style={[styles.header, { paddingTop: insets.top + ${file.extraTop} }]}`
    );
    changed = true;
  }

  // Also handle: style={styles.headerGradient} pattern
  if (src.includes('style={styles.headerGradient}') && !src.includes('insets.top')) {
    src = src.replace(
      /(<LinearGradient[^>]*?)\bstyle=\{styles\.headerGradient\}/s,
      `$1style={[styles.headerGradient, { paddingTop: insets.top + ${file.extraTop} }]}`
    );
    changed = true;
  }

  // ── 4. For non-tab screens: root container gets paddingBottom ──────────────
  if (!file.isTabScreen && !src.includes('insets.bottom')) {
    // Find closing </View> at end (last one before export) and add bottom padding to root View
    // Strategy: replace the root <View style={styles.container}> with inline bottom padding
    src = src.replace(
      /<View style={styles\.container}>/,
      `<View style={[styles.container, { paddingBottom: insets.bottom }]}>`
    );
  }

  if (changed) {
    fs.writeFileSync(fullPath, src, 'utf8');
    console.log(`✓ PATCHED: ${file.path}`);
    totalChanged++;
  } else {
    console.log(`- SKIPPED (already up to date): ${file.path}`);
    totalSkipped++;
  }
}

console.log(`\nDone. Changed: ${totalChanged}, Skipped: ${totalSkipped}`);
