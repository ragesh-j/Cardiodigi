interface DeleteConfirmProps {
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirm = ({ message, onConfirm, onCancel }: DeleteConfirmProps) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
      <h3 className="font-semibold text-slate-900 mb-2">Confirm Delete</h3>
      <p className="text-gray-500 text-sm mb-5">
        {message || 'Are you sure? This action cannot be undone.'}
      </p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      </div>
    </div>
  </div>
)

export default DeleteConfirm