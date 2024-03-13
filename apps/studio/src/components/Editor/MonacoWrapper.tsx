import { useMemo, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { debounce } from '../../helpers';
import { useServices } from '../../services';
import { otherState, useFilesState, useOtherState, useSettingsState } from '../../state';
import { useRef } from 'react';
import type { FunctionComponent } from 'react';
import type { EditorProps as MonacoEditorProps } from '@monaco-editor/react';
import { Awareness } from 'y-protocols/awareness';
import * as monaco from 'monaco-editor';
import { UsersType } from '../../state/other.state';
interface CursorsType {
  lineNumber: number,
  column: number
}
interface SelectionsType {
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number
}
export const MonacoWrapper: FunctionComponent<MonacoEditorProps> = ({
  ...props
}) => {
  const { editorSvc, parserSvc } = useServices();
  const { autoSaving, savingDelay } = useSettingsState(state => state.editor);
  const allUsers = useOtherState((state) => state.users);
  const isCollaborate = useOtherState((state) => state.isCollaborate);
  const file = useFilesState(state => state.files['asyncapi']);
  const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor>();
  const [awarenessElem, setAwareness] = useState<Awareness>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const [myState, setMyState] = useState<{ name?: string; color?: string }>({})
  const [isTrue, setIsTrue] = useState(false)
  const [colors, setColors] = useState<string[]>([])
  const [usersName, setUsersName] = useState<string[]>([])
  const { name, color, collaborateId } = useOtherState(state => state);

  const oncursorChange = (e: any) => {
    const position = e.position;
    const localState = awarenessElem?.getLocalState();
    awarenessElem?.setLocalState({
      ...localState,
      user: { name, color },
      cursor: position
    });
  }
  const onSelectionChange = (e: any) => {
    const selection = e.selection;
    let localState = awarenessElem?.getLocalState();
    localState = { ...localState, user: { name, color } }
    awarenessElem?.setLocalState({
      ...localState,
      user: { name, color },
      selection
    });
  }
  useEffect(() => {
    if (!monacoEditor) return;
    if (!isTrue) return;
    if (name) {
      monacoEditor?.onDidChangeCursorPosition(oncursorChange)
      monacoEditor?.onDidChangeCursorSelection(onSelectionChange);
    }
    if (awarenessElem) {
      awarenessElem.on('update', () => {
        const states = Array.from(awarenessElem.getStates().values()) as UsersType[];
        if (JSON.stringify(states) !== JSON.stringify(allUsers)) {
          otherState.setState({ users: states });
        }
      });
    }
  }, [monacoEditor, name, isTrue, isCollaborate])
  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor) {
    setIsTrue(true)
    editorRef.current = editor;
    const doc = new Y.Doc();
    const collaborateParam = collaborateId;
    const provider: WebsocketProvider = new WebsocketProvider('wss://demos.yjs.dev/ws', collaborateParam, doc);
    const type = doc.getText('monaco');
    const awareness = provider.awareness
    setAwareness(awareness);
    awareness.on('change', () => {
      const arr = Array.from(awareness.getStates().values());
      const newCursors: CursorsType[] = [];
      const newSelections: SelectionsType[] = [];
      let users: string[] = [];

      for (let i = 0; i < arr.length; i++) {
        const cursor = arr[i].cursor;
        const selection = arr[i].selection;
        const user = arr[i].user?.color;
        const name = arr[i].user?.name;
        if (cursor) {
          newCursors.push(cursor);
        }
        if (selection) {
          newSelections.push(selection);
        }
        users.push(user);
        setUsersName([...usersName, name])
      }
      users = [...users, ...users]
      setColors([...colors, ...users])
    })
    const model = editorRef.current?.getModel();
    if (model) {
      new MonacoBinding(type, model, new Set([editorRef.current]));
    }
  }
  useEffect(() => {
    if (!isTrue) return;
    setMyState({
      name,
      color
    })
  }, [name, color, isTrue])
  useEffect(() => {
    if (!isCollaborate || !monacoEditor || !collaborateId || !name) {
      return
    }
    handleEditorDidMount(monacoEditor)
  }, [isCollaborate, monacoEditor, collaborateId, name])
  const onChange = useMemo(() => {
    return debounce((v: string) => {
      editorSvc.updateState({ content: v, file: { from: 'storage', source: undefined } });
      autoSaving && editorSvc.saveToLocalStorage(v, false);
      parserSvc.parse('asyncapi', v);
    }, savingDelay);
  }, [autoSaving, savingDelay]);

  return (
    <MonacoEditor
      language={file.language}
      defaultValue={file.content}
      theme="asyncapi-theme"
      onMount={editor => {
        setMonacoEditor(editor);
        editorSvc.onDidCreate.bind(editorSvc)(editor);
      }}
      className='monaco-editor'
      onChange={onChange}
      options={{
        wordWrap: 'on',
        smoothScrolling: true,
        glyphMargin: true,
      }}
      {...(props || {})}
    />
  );
};
