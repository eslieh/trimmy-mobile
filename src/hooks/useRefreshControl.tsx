import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../theme';

const MIN_SPIN_MS = 500; // a reload that answers instantly still reads as "done"

// Pull to refresh for a list screen: pass the screen's own reload (it may
// return a promise; the spinner stays until it settles) and put the result
// on the ScrollView / FlatList's refreshControl.
export function useRefreshControl(refresh: () => unknown) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const reload = Promise.resolve()
      .then(refresh)
      .catch(() => {}); // the screen shows its own load error
    Promise.all([reload, new Promise((r) => setTimeout(r, MIN_SPIN_MS))]).finally(() => setRefreshing(false));
  }, [refresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.brand.pink}
      colors={[colors.brand.pink]}
      progressBackgroundColor={colors.white}
    />
  );
}
