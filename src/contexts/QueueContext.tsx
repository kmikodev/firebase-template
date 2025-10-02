/**
 * Queue Context - Placeholder (use useQueue hook instead)
 */
import { createContext, ReactNode } from 'react';

interface QueueContextType {
  // Empty for now - use useQueue hook instead
}

const QueueContext = createContext<QueueContextType>({});

export function QueueProvider({ children }: { children: ReactNode }) {
  return (
    <QueueContext.Provider value={{}}>
      {children}
    </QueueContext.Provider>
  );
}

export const useQueueContext = () => {
  throw new Error('Use useQueue hook instead of QueueContext');
};
