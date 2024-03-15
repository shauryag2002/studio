import { VscListSelection, VscCode, VscOpenPreview, VscGraph, VscNewFile, VscSettingsGear } from 'react-icons/vsc';
import { FcCollaboration } from 'react-icons/fc';
import { CiChat1 } from 'react-icons/ci';
import { show as showModal } from '@ebay/nice-modal-react';

import { Tooltip } from './common';
import { SettingsModal, ConfirmNewFileModal } from './Modals';
import { ChatModal } from './Modals/ChatModal';

import { usePanelsState, panelsState, useDocumentsState, otherState } from '../state';
import type { FunctionComponent, ReactNode } from 'react';
import { useEffect } from 'react';
import type { PanelsState } from '../state/panels.state';
import toast from 'react-hot-toast';
import { CollaborationModal } from './Modals/CollaborationModal';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
function updateState(panelName: keyof PanelsState['show'], type?: PanelsState['secondaryPanelType']) {
  const settingsState = panelsState.getState();
  let secondaryPanelType = settingsState.secondaryPanelType;
  const newShow = { ...settingsState.show };

  if (type === 'template' || type === 'visualiser') {
    // on current type
    if (secondaryPanelType === type) {
      newShow[`${panelName}`] = !newShow[`${panelName}`];
    } else {
      secondaryPanelType = type;
      if (newShow[`${panelName}`] === false) {
        newShow[`${panelName}`] = true;
      }
    }
  } else {
    newShow[`${panelName}`] = !newShow[`${panelName}`];
  }

  if (!newShow.primaryPanel && !newShow.secondaryPanel) {
    newShow.secondaryPanel = true;
  }

  panelsState.setState({
    show: newShow,
    secondaryPanelType,
  });
}

interface NavItem {
  name: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  tooltip: ReactNode;
  enabled: boolean;
}

interface SidebarProps { }

export const Sidebar: FunctionComponent<SidebarProps> = () => {
  const { show, secondaryPanelType } = usePanelsState();
  const navigate = useNavigate();
  const document = useDocumentsState(state => state.documents['asyncapi']?.document) || null;
  const isV3 = document?.version() === '3.0.0';
  const isCollaborate = otherState(state => state.isCollaborate);
  const CREATE_ROOM = gql`
      mutation Mutation {
        createRoom
      }
  `;
  const [createRoomMutation] = useMutation(CREATE_ROOM);
  if (show.activityBar === false) {
    return null;
  }
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let collaborateParam = urlParams.get('collaborate');
    otherState.setState({ collaborateId: collaborateParam ?? '' });

    const handleCreateRoom = async () => {
      try {
        const result = await createRoomMutation();
        otherState.setState({ collaborateId: result.data.createRoom });
        collaborateParam = result.data.createRoom;
        return result.data.createRoom;
      } catch (error) {
        console.error('Error creating room:', error);
        return null;
      }
    };

    const copyCollaborationLink = (param: string) => {
      const currentUrl = window.location.href;
      navigator.clipboard.writeText(`${currentUrl}?collaborate=${param}`)
        .then(() => {
          toast.success(`Collaboration Link Copied: ${currentUrl}?collaborate=${param}`, { duration: 5000, style: { maxWidth: 'max-content' } });
          navigate(`/?collaborate=${param}`);
        })
        .catch((error) => {
          console.error('Failed to copy link to clipboard:', error);
        });
    };

    if (collaborateParam) {
      otherState.setState({ isCollaborate: true });
      if (localStorage.getItem('name') === null) {
        otherState.setState({ detailsModal: true });
        showModal(CollaborationModal);
      } else {
        otherState.setState({ isCollaborate: true, name: localStorage.getItem('name') ?? '', color: localStorage.getItem('color') ?? '' });
      }
    }

    if (!isCollaborate) return;

    if (localStorage.getItem('name') === null) {
      otherState.setState({ detailsModal: true });
      showModal(CollaborationModal);
    } else {
      otherState.setState({ isCollaborate: true, name: localStorage.getItem('name') ?? '', color: localStorage.getItem('color') ?? '' });
    }

    if (!collaborateParam) {
      handleCreateRoom().then((result) => {
        collaborateParam = result;
        copyCollaborationLink(collaborateParam ?? '');
      });
    } else {
      copyCollaborationLink(collaborateParam ?? '');
    }
  }, [isCollaborate]);
  let navigation: NavItem[] = [
    // navigation
    {
      name: 'primarySidebar',
      title: 'Navigation',
      isActive: show.primarySidebar,
      onClick: () => updateState('primarySidebar'),
      icon: <VscListSelection className="w-5 h-5" />,
      tooltip: 'Navigation',
      enabled: true
    },
    // editor
    {
      name: 'primaryPanel',
      title: 'Editor',
      isActive: show.primaryPanel,
      onClick: () => updateState('primaryPanel'),
      icon: <VscCode className="w-5 h-5" />,
      tooltip: 'Editor',
      enabled: true
    },
    // template
    {
      name: 'template',
      title: 'Template',
      isActive: show.secondaryPanel && secondaryPanelType === 'template',
      onClick: () => updateState('secondaryPanel', 'template'),
      icon: <VscOpenPreview className="w-5 h-5" />,
      tooltip: 'HTML preview',
      enabled: true
    },
    // visuliser
    {
      name: 'visualiser',
      title: 'Visualiser',
      isActive: show.secondaryPanel && secondaryPanelType === 'visualiser',
      onClick: () => updateState('secondaryPanel', 'visualiser'),
      icon: <VscGraph className="w-5 h-5" />,
      tooltip: 'Blocks visualiser',
      enabled: !isV3
    },
    // newFile
    {
      name: 'newFile',
      title: 'New file',
      isActive: false,
      onClick: () => showModal(ConfirmNewFileModal),
      icon: <VscNewFile className="w-5 h-5" />,
      tooltip: 'New file',
      enabled: true
    },
    // collaboration
    {
      name: 'collaboration',
      title: 'Collaboration',
      isActive: false,
      onClick: () => {
        if (localStorage.getItem('name') === null && localStorage.getItem('color') === null) {
          otherState.setState({ detailsModal: true })
          showModal(CollaborationModal)
        } else {
          otherState.setState({ isCollaborate: true, name: localStorage.getItem('name') ?? '', color: localStorage.getItem('color') ?? '' })
        }
      },
      icon: <FcCollaboration className="w-5 h-5" />,
      tooltip: 'Collaboration',
      enabled: true
    },
    // Chat
    {
      name: 'Chat',
      title: 'Chat',
      isActive: false,
      onClick: () => {
        otherState.setState({ chatModal: true })
      },
      icon: <CiChat1 className="w-5 h-5" />,
      tooltip: 'Chat',
      enabled: isCollaborate
    }
  ];

  navigation = navigation.filter(item => item.enabled);

  return (
    <div className="flex flex-col bg-gray-800 shadow-lg border-r border-gray-700 justify-between">
      <div className="flex flex-col">
        {navigation.map(item => (
          <Tooltip content={item.tooltip} placement='right' hideOnClick={true} key={item.name}>
            <button
              title={item.title}
              onClick={() => item.onClick()}
              className={'flex text-sm focus:outline-none border-box p-2'}
              type="button"
            >
              <div className={item.isActive ? 'bg-gray-600 p-2 rounded text-white' : 'p-2 text-gray-500 hover:text-white'}>
                {item.icon}
              </div>
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-col">
        <Tooltip content='Studio settings' placement='right' hideOnClick={true}>
          <button
            title="Studio settings"
            className='flex text-gray-500 hover:text-white focus:outline-none border-box p-4'
            type="button"
            onClick={() => showModal(SettingsModal)}
          >
            <VscSettingsGear className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
      <ChatModal />
    </div>
  );
};