import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/app/lib/utils";

const PREFIX = "+65";

function parsePhone(full: string): string {
  if (full.startsWith(PREFIX)) return full.slice(PREFIX.length).trim();
  return full;
}

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  placeholder = "9123 4567",
  className,
  inputClassName,
}: PhoneInputProps) {
  const [phoneNumber, setPhoneNumber] = useState(parsePhone(value));

  useEffect(() => {
    if (value) setPhoneNumber(parsePhone(value));
  }, []);

  return (
    <div className={cn("flex", className)}>
      <span className="shrink-0 inline-flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm text-foreground select-none whitespace-nowrap">
        🇸🇬 +65
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d\s]/g, "");
          setPhoneNumber(digits);
          onChange?.(`${PREFIX} ${digits}`.trim());
        }}
        className={cn("rounded-l-none", inputClassName)}
      />
    </div>
  );
}
