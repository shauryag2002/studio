import React, { FunctionComponent, useEffect, useState } from 'react'
import { useOtherState, otherState } from '../../state'
import { GiTireIronCross } from 'react-icons/gi';
import { useQuery, gql, useMutation, useSubscription } from '@apollo/client';
export const ChatModal: FunctionComponent = () => {
    const IsChatOpen = useOtherState((state) => (state.chatModal))
    const { collaborateId, color, name } = useOtherState((state) => (state))
    const [message, setMessage] = useState('')
    const postMessage = gql`
    mutation Mutation($user: String!, $content: String!, $roomId: ID!, $color: String!) {
      postMessage(user: $user, content: $content, roomId: $roomId, color: $color) {
      message {
        content
        user
      }  
      }
    }
    `
    const subscribeMessages = gql`
    subscription Subscription($roomId: ID!) {
      messageAdded(roomId: $roomId) {
      user
      content
      color  
      }
    }
    `
    const ALL_MESSAGES = gql`
    query ExampleQuery($roomId: ID!) {
      room(id: $roomId) {
        id
        messages {
          color
          content
          user
        }
      }
    }
    `
    interface AllMessageType {
        color?: string;
        content?: string;
        user?: string;
    }
    const [sendMessage] = useMutation(postMessage)
    const { data: allmess } = useQuery(ALL_MESSAGES, {
        variables: { roomId: collaborateId }
    })
    const { data: newMessage } = useSubscription(subscribeMessages, {
        variables: { roomId: collaborateId }
    })
    const handleSendMessage = () => {
        if (!message || !name || !color || !collaborateId) return
        sendMessage({
            variables: {
                user: name,
                content: message,
                roomId: collaborateId,
                color
            }
        })

        setMessage('')
    }
    const [allMessages, setAllMessages] = useState<AllMessageType[]>([])
    useEffect(() => {
        if (newMessage) {
            setAllMessages([...allMessages, newMessage?.messageAdded])
        }
    }, [newMessage])
    useEffect(() => {
        if (allmess) {
            setAllMessages(allmess?.room?.messages)
        }
    }, [allmess])
    useEffect(() => {
        const lastElement = document.querySelector('#last');
        if (lastElement) {
            lastElement.scrollIntoView({ behavior: 'smooth' });
        }
    }, [allMessages])
    if (!IsChatOpen) return null
    return (
        <div className="chats  h-[450px] w-[400px] bg-gray-800 shadow-lg border-r pt-10 border-gray-700 fixed bottom-0 left-[10px] z-[10000]">
            <GiTireIronCross className="w-5 h-5 absolute top-4 right-4 text-white" onClick={() => otherState.setState({ chatModal: false })} />
            <div className="allChat smooth-scroll overflow-y-auto w-full px-3 h-[350px]">
                <div id='chatting' className="flex flex-col space-y-2">
                    {allMessages?.map((message: AllMessageType, index: number) => (
                        <div key={index} className={`flex space-x-2 ${message?.user === name ? 'self-end' : ''}`}>
                            {message?.user === name ? (

                                <>
                                    <div className="bg-blue-500 rounded-lg p-2">
                                        <p className="text-white max-w-[294px] break-words">{message?.content}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded text-black flex items-center justify-center" title={message?.user} style={{ background: message?.color }}>
                                        {message?.user[0]?.toUpperCase()}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div title={message?.user} className="h-10 w-10 rounded text-black flex items-center justify-center" style={{ background: message?.color }}>
                                        {message?.user?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-2">
                                        <p className="text-white max-w-[294px] break-words">{message?.content}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                <div id="last" className='h-10'></div>
            </div>
            <div className="p-4 flex absolute gap-2 bottom-1 w-full">
                <input
                    type="text"
                    className="w-full bg-gray-700 rounded-lg p-2 text-white"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={
                        (e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage()
                            }
                        }
                    }
                />
                <button className=" bg-blue-500 rounded-lg p-2 text-white" onClick={handleSendMessage}>
                    Send
                </button>
            </div>
        </div>
    )
}

