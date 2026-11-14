import { View } from 'react-native';
import { Header } from '../../components/Header';
import { Empty } from '../../components/ui';

/** Chat comes in the next iteration (opens after a request is accepted). */
export default function Messages() {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Messages" />
      <Empty
        icon="chatbox-ellipses-outline"
        title="No conversations yet"
        body="Chat opens with your co-rider once a ride request is accepted."
      />
    </View>
  );
}
