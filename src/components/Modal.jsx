import { useEffect } from 'react';

export default function Modal({ title, open, onClose, children, footer }) {
	useEffect(() => {
		function onKey(e) {
			if (e.key === 'Escape') onClose?.();
		}
		if (open) document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
				<div className="px-6 py-4 border-b flex items-center justify-between">
					<div className="text-lg font-semibold">{title}</div>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-700">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
				{footer && <div className="px-6 py-4 border-t bg-gray-50">{footer}</div>}
			</div>
		</div>
	);
}


