"use client";

type Props = {
  open: boolean;
  count: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmSendModal({
  open,
  count,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Send this newsletter?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          You are about to send this newsletter to{" "}
          <span className="font-semibold text-slate-900">
            {count} recipient{count === 1 ? "" : "s"}
          </span>
          . This cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || count === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Confirm & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
