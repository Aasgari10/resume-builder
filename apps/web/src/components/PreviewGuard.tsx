// If a template throws while drawing the preview (after an edit, say), the editor shows a short
// note with a way back instead of a white page; it tries again whenever the content changes.

import { Component, type ReactNode } from "react";

type Props = { resetKey: unknown; onUndo?: () => void; children: ReactNode };
type State = { failed: boolean };

export class PreviewGuard extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[preview]", error);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="preview-guard" dir="rtl" role="alert">
        <p>این صفحه با آخرین تغییر درست نمایش داده نشد.</p>
        {this.props.onUndo && (
          <button type="button" className="btn" onClick={this.props.onUndo}>
            برگرداندن آخرین تغییر
          </button>
        )}
      </div>
    );
  }
}
