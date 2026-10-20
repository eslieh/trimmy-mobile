// A minimal server-sent events client on XMLHttpRequest, which streams on
// both platforms (React Native has no EventSource, and its fetch can't read
// a body incrementally). Unlike a browser EventSource it can send the Bearer
// header, and it never reconnects by itself — RealtimeConnector owns that,
// so backoff, token refresh and app-state handling live in one place.

export type SseEvent = { event: string; data: string; id: string | null };

type Handlers = {
  onEvent: (event: SseEvent) => void;
  // Any bytes at all, heartbeats included — feeds the connection watchdog.
  onActivity: () => void;
  // status: the HTTP status if the server answered with an error, else null
  // (network failure, or the stream ended).
  onClose: (status: number | null) => void;
};

export function openEventStream(url: string, headers: Record<string, string>, handlers: Handlers): { close: () => void } {
  const xhr = new XMLHttpRequest();
  let processed = 0;
  let buffer = '';
  let closed = false;
  // Fields of the event being read; dispatched at the blank line.
  let eventName = '';
  let dataLines: string[] = [];
  let eventId: string | null = null;

  const finish = (status: number | null) => {
    if (closed) return;
    closed = true;
    handlers.onClose(status);
  };

  const dispatchLine = (line: string) => {
    if (line === '') {
      if (dataLines.length > 0 || eventName) {
        handlers.onEvent({ event: eventName || 'message', data: dataLines.join('\n'), id: eventId });
      }
      eventName = '';
      dataLines = [];
      eventId = null;
      return;
    }
    if (line.startsWith(':')) return; // comment (heartbeat)
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') eventName = value;
    else if (field === 'data') dataLines.push(value);
    else if (field === 'id') eventId = value;
  };

  const readNew = () => {
    const text = xhr.responseText ?? '';
    if (text.length <= processed) return;
    buffer += text.slice(processed);
    processed = text.length;
    handlers.onActivity();
    let newline = buffer.search(/\r\n|\n|\r/);
    while (newline !== -1) {
      const line = buffer.slice(0, newline);
      const width = buffer.startsWith('\r\n', newline) ? 2 : 1;
      buffer = buffer.slice(newline + width);
      if (closed) return;
      dispatchLine(line);
      newline = buffer.search(/\r\n|\n|\r/);
    }
  };

  // Setting onprogress is what makes React Native deliver the body
  // incrementally instead of all at once when the request completes.
  xhr.onprogress = () => {
    if (xhr.status === 200) readNew();
  };
  xhr.onreadystatechange = () => {
    if (closed) return;
    if (xhr.readyState === XMLHttpRequest.LOADING && xhr.status === 200) readNew();
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) readNew();
      finish(xhr.status && xhr.status !== 200 ? xhr.status : null);
    }
  };
  xhr.onerror = () => finish(null);
  xhr.ontimeout = () => finish(null);

  xhr.open('GET', url);
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
  xhr.send();

  return {
    close: () => {
      if (closed) return;
      closed = true; // no onClose: the caller chose to close
      xhr.abort();
    },
  };
}
