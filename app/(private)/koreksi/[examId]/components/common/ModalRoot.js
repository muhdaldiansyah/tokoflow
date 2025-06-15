// app/dashboard/autograde/[examId]/components/common/ModalRoot.js
import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalRoot({ children }) {
  const elRef = useRef(null);
  if (!elRef.current) elRef.current = document.createElement('div');

  useEffect(() => {
    const modalRoot = document.getElementById('modal-root') ?? (() => {
      const div = document.createElement('div');
      div.id = 'modal-root';
      document.body.appendChild(div);
      return div;
    })();

    modalRoot.appendChild(elRef.current);
    return () => modalRoot.removeChild(elRef.current);
  }, []);

  return createPortal(children, elRef.current);
}
