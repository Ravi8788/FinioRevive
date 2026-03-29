import Modal from './Modal';

export default function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-700">{description}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
          Confirm
        </button>
      </div>
    </Modal>
  );
}
