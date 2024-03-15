import React, { FunctionComponent, useEffect, useState } from 'react'
import { filesState, otherState, useOtherState } from '../../state'
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client'
import { useServices } from '../../services'
export const Versions: FunctionComponent = () => {
  const collaborateId = useOtherState(state => state.collaborateId)
  const isCollaborate = useOtherState(state => state.isCollaborate)
  const { editorSvc } = useServices();
  const all_Versions = gql`
    query Query($roomId: ID!) {
      versions(roomId: $roomId)
    }
    `
  const create_Version = gql`
    mutation Mutation($createVersionRoomId2: ID!, $version: String!) {
      createVersion(roomId: $createVersionRoomId2, version: $version)
    }
    `
  const version_Subscription = gql`
    subscription Subscription($roomId: ID!) {
      versions(roomId: $roomId)
    }
    `
  const { data: allVersion } = useQuery(all_Versions, {
    variables: { roomId: collaborateId },
  })
  const { data: versionData } = useSubscription(version_Subscription, {
    variables: { roomId: collaborateId },
  })
  const [allVersions, setAllVersions] = useState<string[]>(allVersion ?? [])
  const [createVersionMutate] = useMutation(create_Version)
  const versionModalOpen = useOtherState(state => state.versionModalOpen)
  const handleCreateVersion = async () => {
    await createVersionMutate({ variables: { createVersionRoomId2: collaborateId, version: filesState.getState().files['asyncapi'].content } })
  }
  useEffect(() => {
    if (versionData?.versions) {
      setAllVersions([versionData.versions, ...allVersions])
      otherState.setState({ versions: [versionData, ...allVersions] })
    }
  }, [versionData])
  useEffect(() => {
    if (allVersion?.versions && allVersion?.versions.length !== allVersions.length) {
      setAllVersions(allVersion.versions)
      otherState.setState({ versions: allVersion.versions })
    }
  }, [allVersion])
  if (!isCollaborate) return null
  if (!versionModalOpen) return null
  let versionNum: number = allVersions.length - 1;

  return (
    <div className='p-2 bg-slate-100'>
      <div className="bg-[#6eeb83] text-center py-2 cursor-pointer" onClick={handleCreateVersion}>Create Version</div>
      <div className="flex flex-col">
        {allVersions?.map((version: string, index: number) => (
          <div key={index} className="flex justify-between items-center px-4 py-1">
            <div>Version {versionNum--}</div>
            <div className="flex ">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onClick={() => {
                editorSvc.updateState({ content: version, updateModel: true });
              }}>Select</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
