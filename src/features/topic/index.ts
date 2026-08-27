/**
 * Topic feature: the tracker page for a single topic.
 *
 * Props-driven and stateless by design — it reads session data passed in and
 * emits intents (rename, practice) to the host. Host it from any screen.
 */

export { TopicView, type TopicViewProps } from "./components/topic-view"
export { SessionList, TopicBadge } from "./components/session-list"
