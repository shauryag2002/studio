import React, { useState } from 'react'
import { otherState, useOtherState } from '../../state'
import { ConfirmModal } from './ConfirmModal'
import { create } from '@ebay/nice-modal-react';
export const CollaborationModal = create(() => {
    const IsCollaborationOpen = useOtherState((state) => (state.detailsModal))
    const [nameState, setNameState] = useState('')
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };
    if (!IsCollaborationOpen || localStorage.getItem('name') || localStorage.getItem('color')) return null
    return (
        <ConfirmModal title="Collaboration Details" confirmText="Save" confirmDisabled={nameState === ''} onSubmit={() => {
            if (nameState === '') return
            const color = getRandomColor()
            otherState.setState({ name: nameState, color, detailsModal: false, isCollaborate: true })
            localStorage.setItem('name', nameState)
            localStorage.setItem('color', color)
        }} onCancel={() => { }}>

            <div className="w-full m-auto bg-white">
                <div className='w-full top-[40px] flex flex-col gap-1'>
                    <div className='flex w-full'>
                        <label htmlFor="name" className='mr-[13px] self-center'>Name:</label>
                        <input type="text" id="name" name="name" onChange={
                            (e) => setNameState(e.target.value)
                        } value={nameState} className='flex-[4] p-2 items-center border-pink-600 border-b-2 outline-none' />
                    </div>
                </div>
            </div>
        </ConfirmModal>
    )
})