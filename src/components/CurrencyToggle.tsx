import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/types/transaction";

interface Props {
  onChange?: (currency: CurrencyCode) => void;
}

export default function CurrencyToggle({ onChange }: Props) {
  const { currency, setCurrency } = useCurrency();

  const handleChange = (next: CurrencyCode) => {
    setCurrency(next);
    onChange?.(next);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant={currency === "ARS" ? "default" : "outline"}
        size="sm"
        onClick={() => handleChange("ARS")}
      >
        ARS
      </Button>
      <Button
        variant={currency === "USD" ? "default" : "outline"}
        size="sm"
        onClick={() => handleChange("USD")}
      >
        USD
      </Button>
    </div>
  );
}
