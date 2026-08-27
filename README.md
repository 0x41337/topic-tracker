# Topic Tracker

Track your study progress with daily practice sessions. Create topics, organize them in folders, and watch your scores improve over time.

## Why?

Most study apps focus on content delivery. Topic Tracker focuses on **performance tracking**, you bring the questions, it tracks how well you're doing. Each topic becomes a living record of your progress, with charts showing trends, streaks, and rankings.

## Features

### Practice Mode

One tap per answer. **Hit** or **Miss**, that's it. Your score updates instantly, and at the end of each day you get a complete session record. Undo mistakes with a single click.

### Visual Progress

Every topic shows a dashboard with:

- Daily activity (hits vs. misses)
- Cumulative score trend
- Streak tracking
- Comparison against your previous session

### Organize Your Way

Folders, subfolders, topics, drag and drop to rearrange. Multi-select to move entire groups at once. Search to find anything instantly.

### Global Dashboard

See all your topics ranked by score. Spot which areas need more practice. Track daily activity across everything you're studying.

### Keep Your Data

Everything stays in your browser, no account needed. Export your data as JSON to back it up or move to another device.

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and start adding your study topics.

## Organization

- **Topics**: individual subjects you're tracking (e.g., "Spanish Vocabulary", "Linear Algebra")
- **Folders**: group related topics together
- **Sessions**: one per day per topic, accumulating your practice throughout the day

## Data

All data **lives in your browser's** localStorage. Use the toolbar menu to export/import JSON backups, load sample data, or clear everything.
