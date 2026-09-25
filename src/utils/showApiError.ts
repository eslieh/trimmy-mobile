import { Alert } from 'react-native';
import { getApiErrorMessage } from '../api/client';

// For actions whose screen has no inline error slot (sheets, row buttons):
// surface the server's message instead of letting the rejection go unhandled.
export function showApiError(title: string, err: unknown) {
  Alert.alert(title, getApiErrorMessage(err, 'Something went wrong. Please try again.'));
}
