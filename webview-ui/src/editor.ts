/**
 * CodeMirror 6 Editor Setup for Strudel Box
 */

import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { keymap } from '@codemirror/view';

type EvaluateCallback = (code: string) => void;

/**
 * Create a CodeMirror editor instance
 */
export function createEditor(
  parent: HTMLElement,
  initialCode: string,
  onEvaluate: EvaluateCallback
): EditorView {
  
  // Custom keymap for Strudel - with highest priority
  const strudelKeymap = Prec.highest(keymap.of([
    {
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: (view) => {
        console.log('[STRUDEL-EDITOR] Cmd/Ctrl+Enter pressed - evaluating');
        onEvaluate(view.state.doc.toString());
        return true; // Prevent default behavior
      },
      preventDefault: true
    },
    {
      key: 'Ctrl-.',
      mac: 'Cmd-.',
      run: () => {
        console.log('[STRUDEL-EDITOR] Cmd/Ctrl+. pressed - hushing');
        window.dispatchEvent(new CustomEvent('strudel-hush'));
        return true;
      },
      preventDefault: true
    }
  ]));

  // Dark theme using CSS variables
  const darkTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      backgroundColor: 'var(--bg-secondary)'
    },
    '.cm-scroller': {
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      overflow: 'auto'
    },
    '.cm-content': {
      caretColor: 'var(--accent-primary)',
      padding: '12px 0'
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--accent-primary)',
      borderLeftWidth: '2px'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--accent-primary-transparent)'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-muted)',
      border: 'none',
      paddingRight: '8px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bg-secondary)'
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--bg-tertiary)'
    },
    '.cm-line': {
      padding: '0 12px'
    }
  }, { dark: true });

  const state = EditorState.create({
    doc: initialCode,
    extensions: [
      strudelKeymap,  // Highest priority - MUST be first
      basicSetup,
      javascript(),
      darkTheme,
      EditorView.lineWrapping
    ]
  });

  return new EditorView({
    state,
    parent
  });
}

/**
 * Get current code from editor
 */
export function getCode(editor: EditorView): string {
  return editor.state.doc.toString();
}

/**
 * Set code in editor
 */
export function setCode(editor: EditorView, code: string): void {
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: code
    }
  });
}
