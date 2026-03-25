export function InvalidLink() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.856-2.07a4.5 4.5 0 00-6.364-6.364L4.5 8.257"
          />
        </svg>
        <h2 className="mb-2 text-lg font-semibold text-stone-900">
          Invalid or Expired Link
        </h2>
        <p className="text-sm text-stone-500">
          The link you followed is no longer valid. Please check the link and try
          again, or contact the sender for a new invitation.
        </p>
      </div>
    </div>
  );
}
