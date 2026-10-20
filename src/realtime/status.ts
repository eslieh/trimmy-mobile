// Whether the live stream is open right now. Its own module so the push
// handler can read it without importing the connector (and, through it,
// AuthContext, which imports the push code).
let connected = false;

export function setRealtimeConnected(value: boolean): void {
  connected = value;
}

export function isRealtimeConnected(): boolean {
  return connected;
}
