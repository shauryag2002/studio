import React, { useState, useEffect, FunctionComponent } from 'react';
import { useOtherState } from '../../state';
import { FaUsers } from 'react-icons/fa';
import { UsersType } from '../../state/other.state';
export const UserPresence: FunctionComponent = () => {
  const users = useOtherState((state) => state.users);
  const usersRef = React.useRef<HTMLElement | null>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const userAll = document.querySelectorAll('.users-all')
    userAll.forEach((elem: Element, index: number) => {
      const div = elem as HTMLElement
      div.style.backgroundColor = `${users[index]?.user?.color}`
    })
    usersRef?.current?.addEventListener('mouseenter', () => {
      setShow(true)
    })
  }, [users])

  return (
    <div className='hover:flex items-center justify-center hover:gap-[2px]  hover:max-w-[600px]' onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {show && users.map((elem: UsersType, index: number) => {
        return <div key={index} title={elem?.user?.name} className={`h-[25px] text-white w-[25px] users-all hover:static bg-[${elem?.user?.color}] flex justify-center items-center`} style={{ backgroundColor: elem?.user?.color }}>
          {String(elem?.user?.name?.[0]).toUpperCase()}
        </div>
      })}
      <FaUsers />
    </div>
  );
};
