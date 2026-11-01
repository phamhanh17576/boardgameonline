import { useEffect, useRef } from 'react';
import type { GameEvent } from '../../engine';
import { useStore } from '../store';

/** Gọi handler cho mỗi sự kiện mới (không phát lại sự kiện cũ khi vừa mount). */
export function useFxEvents(handler: (e: GameEvent) => void) {
  const last = useRef<number>(useStore.getState().lastSeq);
  const h = useRef(handler);
  h.current = handler;
  useEffect(
    () =>
      useStore.subscribe((s) => {
        for (const e of s.fx) {
          if (e.seq > last.current) {
            last.current = e.seq;
            h.current(e);
          }
        }
      }),
    [],
  );
}
