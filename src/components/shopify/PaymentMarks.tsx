export function PaymentMarks() {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Supported payment methods">
      <span
        role="img"
        aria-label="Visa"
        className="flex h-9 min-w-[72px] items-center justify-center rounded-sm border border-white/20 bg-[#1434cb] px-3 font-sans text-base font-black italic tracking-tight text-white"
      >
        VISA
      </span>
      <span
        role="img"
        aria-label="Mastercard"
        className="relative flex h-9 min-w-[72px] items-center justify-center overflow-hidden rounded-sm border border-white/20 bg-white px-2"
      >
        <span aria-hidden="true" className="absolute left-[18px] h-6 w-6 rounded-full bg-[#eb001b]" />
        <span aria-hidden="true" className="absolute right-[18px] h-6 w-6 rounded-full bg-[#f79e1b] opacity-90" />
        <span className="relative mt-6 bg-white/85 px-1 font-sans text-[7px] font-bold leading-none text-[#222]">mastercard</span>
      </span>
      <span
        role="img"
        aria-label="Maestro"
        className="relative flex h-9 min-w-[72px] items-center justify-center overflow-hidden rounded-sm border border-white/20 bg-white px-2"
      >
        <span aria-hidden="true" className="absolute left-[18px] h-6 w-6 rounded-full bg-[#0099df]" />
        <span aria-hidden="true" className="absolute right-[18px] h-6 w-6 rounded-full bg-[#ed1c2e] opacity-90" />
        <span className="relative mt-6 bg-white/85 px-1 font-sans text-[7px] font-bold leading-none text-[#222]">maestro</span>
      </span>
      <span
        role="img"
        aria-label="Visa Electron"
        className="flex h-9 min-w-[72px] flex-col items-center justify-center rounded-sm border border-white/20 bg-[#1434cb] px-3 font-sans font-black italic leading-none text-white"
      >
        <span className="text-sm">VISA</span>
        <span className="mt-0.5 text-[7px] font-semibold not-italic tracking-wide">Electron</span>
      </span>
      <PayPalMark />
    </div>
  );
}

export function PayPalMark({ prominent = false }: { prominent?: boolean }) {
  return (
    <span
      role="img"
      aria-label="PayPal"
      className={`inline-flex items-center justify-center rounded-sm border px-3 font-sans font-black italic tracking-[-0.06em] ${
        prominent
          ? "h-11 min-w-[112px] border-[#e3ad16] bg-[#ffc439] text-xl shadow-sm"
          : "h-9 min-w-[72px] border-white/20 bg-white text-base"
      }`}
    >
      <span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span>
    </span>
  );
}
