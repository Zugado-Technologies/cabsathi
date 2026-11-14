import { MessageSquareMore } from 'lucide-react';
import { Empty } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';

/** Chat comes in the next iteration (opens after a request is accepted). */
export default function Messages() {
  return (
    <>
      <WaveHeader title="Messages" />
      <div className="app-body">
        <Empty
          icon={<MessageSquareMore size={36} color="var(--faint)" />}
          title="No conversations yet"
          body="Chat opens with your co-rider once a ride request is accepted."
        />
      </div>
    </>
  );
}
