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
  chatModal: boolean;
  detailsModal: boolean;
  isCollaborate: boolean;
  name: string;
  users: UsersType[];
  color: string;
  collaborateId: string;
  versions: string[];
  versionModalOpen: boolean;
}

export const otherState = create<OtherState>(() => ({
  editorHeight: 'calc(100% - 36px)',
  templateRerender: false,
  chatModal: false,
  detailsModal: false,
  isCollaborate: false,
  users: [],
  name: '',
  color: '',
  collaborateId: '',
  versions: [],
  versionModalOpen: false,
}));

export const useOtherState = otherState;