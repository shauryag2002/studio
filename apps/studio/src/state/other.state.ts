import create from 'zustand';
export interface UsersType {
  cursor: {
    column?: number,
    lineNumber?: number
  },
  selection: {
    endColumn?: number, endLineNumber?: number, positionColumn?: number, positionLineNumber?: number, selectionStartColumn?: number, selectionStartLineNumber?: number, startColumn?: number, startLineNumber?: number
  },
  user: {
    color?: string, name?: string
  }
}
export type OtherState = {
  editorHeight: string;
  templateRerender: boolean;
  detailsModal: boolean;
  isCollaborate: boolean;
  name: string;
  users: UsersType[];
  color: string;
  collaborateId: string;
}

export const otherState = create<OtherState>(() => ({
  editorHeight: 'calc(100% - 36px)',
  templateRerender: false,
  detailsModal: false,
  isCollaborate: false,
  users: [],
  name: '',
  color: '',
  collaborateId: '',
}));

export const useOtherState = otherState;