// Companion Event Manager for Draggable Sentinel Robot
export interface CompanionFinding {
  title: string;
  severity: 'critical' | 'warning' | 'minor' | 'clean';
  description: string;
  evidence: string;
  action?: string;
  appUrl?: string;
}

type Listener = (finding: CompanionFinding) => void;
type ToggleListener = (open: boolean) => void;

class CompanionEventEmitter {
  private findingListeners: Set<Listener> = new Set();
  private toggleListeners: Set<ToggleListener> = new Set();

  onFinding(listener: Listener) {
    this.findingListeners.add(listener);
    return () => this.findingListeners.delete(listener);
  }

  onToggle(listener: ToggleListener) {
    this.toggleListeners.add(listener);
    return () => this.toggleListeners.delete(listener);
  }

  breakdown(finding: CompanionFinding) {
    this.findingListeners.forEach((l) => l(finding));
  }

  setOpen(open: boolean) {
    this.toggleListeners.forEach((l) => l(open));
  }
}

export const companionEvents = new CompanionEventEmitter();
