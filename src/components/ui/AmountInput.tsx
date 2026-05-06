import { useState, useCallback } from "react";
import { Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function formatForDisplay(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function sanitizeExpression(expr: string): string {
  return expr.replace(/[^0-9+\-*/.()]/g, "");
}

function evaluateExpression(expr: string): number | null {
  if (!expr.trim()) {
    return null;
  }
  try {
    const sanitized = sanitizeExpression(expr);
    const result = Function("return " + sanitized)();
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function toggleSign(value: string): string {
  if (!value || value === "0") {
    return "0";
  }
  return value.startsWith("-") ? value.slice(1) : "-" + value;
}

function computeResult(prev: string, current: string, op: string): string {
  const a = parseFloat(prev);
  const b = parseFloat(current);
  switch (op) {
    case "+":
      return (a + b).toString();
    case "-":
      return (a - b).toString();
    case "*":
      return (a * b).toString();
    case "/":
      return b !== 0 ? (a / b).toString() : "0";
    default:
      return current;
  }
}

function toDisplayOperator(op: string | null): string {
  switch (op) {
    case "+":
      return "+";
    case "-":
      return "−";
    case "*":
      return "×";
    case "/":
      return "÷";
    default:
      return "";
  }
}

export default function AmountInput({
  value,
  onChange,
  onValueChange,
  placeholder = "0,00",
  className,
}: AmountInputProps) {
  const baseButtonClass = "h-9 rounded-md border text-sm font-medium border-white/10 hover:bg-white/10 transition-colors";
  const operatorButtonClass = "bg-[var(--color-background-info)] text-[var(--color-text-info)]";
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState("0");
  const [result, setResult] = useState<number | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentValue("0");
    setResult(null);
    setPreviousValue(null);
    setOperator(null);
    setShouldResetDisplay(false);
  }, []);

  const handleUseResult = useCallback(() => {
    if (result != null && Number.isFinite(result)) {
      const rawValue = result.toString();
      onValueChange(rawValue);
    }
    handleClose();
  }, [result, onValueChange, handleClose]);

  const handleKeyPress = useCallback((key: string) => {
    setCurrentValue((prev) => {
      let nextValue = prev;

      if (key === "⌫") {
        if (prev === "0") {
          return prev;
        }
        nextValue = prev.slice(0, -1) || "0";
        setResult(evaluateExpression(nextValue));
        return nextValue;
      }

      switch (key) {
        case "C":
          setResult(null);
          setPreviousValue(null);
          setOperator(null);
          setShouldResetDisplay(false);
          return "0";
        case "±":
          nextValue = toggleSign(prev);
          setResult(evaluateExpression(nextValue));
          return nextValue;
        case ",":
          if (shouldResetDisplay) {
            nextValue = "0.";
            setShouldResetDisplay(false);
          } else if (!prev.includes(".")) {
            nextValue = prev === "0" ? "0." : prev + ".";
          } else {
            nextValue = prev;
          }
          setResult(evaluateExpression(nextValue));
          return nextValue;
        case "=": {
          if (!operator || previousValue === null) {
            return prev;
          }
          const computed = computeResult(previousValue, prev || "0", operator);
          setPreviousValue(null);
          setOperator(null);
          setShouldResetDisplay(true);
          setResult(Number.parseFloat(computed));
          return computed;
        }
        case "+":
        case "-":
        case "*":
        case "/": {
          const activeValue = prev || "0";
          if (previousValue === null) {
            setPreviousValue(activeValue);
          } else if (operator && !shouldResetDisplay) {
            const computed = computeResult(previousValue, activeValue, operator);
            setPreviousValue(computed);
            setResult(parseFloat(computed));
            nextValue = activeValue;
          }
          setOperator(key);
          setShouldResetDisplay(true);
          return activeValue;
        }
        default:
          if (key === "00") {
            if (shouldResetDisplay) {
              nextValue = "0";
              setShouldResetDisplay(false);
            } else {
              nextValue = prev === "0" ? "0" : prev + "00";
            }
            setResult(evaluateExpression(nextValue));
            return nextValue;
          }
          if (/^\d$/.test(key)) {
            if (shouldResetDisplay) {
              nextValue = key;
              setShouldResetDisplay(false);
            } else {
              nextValue = prev === "0" ? key : prev + key;
            }
            setResult(evaluateExpression(nextValue));
            return nextValue;
          }
          return prev;
      }
    });
  }, [operator, previousValue, shouldResetDisplay]);

  const parsedCurrent = Number.parseFloat(currentValue);
  const displayResult = result != null && Number.isFinite(result)
    ? formatForDisplay(result)
    : Number.isFinite(parsedCurrent)
      ? formatForDisplay(parsedCurrent)
      : "0";
  const displayExpression = previousValue && operator
    ? shouldResetDisplay
      ? `${previousValue} ${toDisplayOperator(operator)}`
      : `${previousValue} ${toDisplayOperator(operator)} ${currentValue}`
    : currentValue === "0"
      ? ""
      : currentValue;

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center border rounded-md bg-transparent hover:bg-secondary transition-colors cursor-pointer"
              style={{ right: "2px" }}
              aria-label="Abrir calculadora"
            />
          }
        >
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2">
          <div
            className="bg-secondary rounded-md p-[10px] mb-2"
            style={{ background: "var(--color-background-secondary)" }}
          >
            <div className="text-xs text-muted-foreground truncate mb-1">{displayExpression}</div>
            <div className="text-lg font-medium">{displayResult}</div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: "C" },
              { key: "⌫" },
              { key: "±" },
              { key: "/", display: "÷", isOperator: true },
            ].map(({ key, display, isOperator }) => (
              <button
                key={display ?? key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={cn(baseButtonClass, isOperator && operatorButtonClass)}
                style={{
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                {display ?? key}
              </button>
            ))}
            {[
              { key: "7" },
              { key: "8" },
              { key: "9" },
              { key: "*", display: "×", isOperator: true },
            ].map(({ key, display, isOperator }) => (
              <button
                key={display ?? key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={cn(baseButtonClass, isOperator && operatorButtonClass)}
                style={{
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                {display ?? key}
              </button>
            ))}
            {[
              { key: "4" },
              { key: "5" },
              { key: "6" },
              { key: "-", display: "−", isOperator: true },
            ].map(({ key, display, isOperator }) => (
              <button
                key={display ?? key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={cn(baseButtonClass, isOperator && operatorButtonClass)}
                style={{
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                {display ?? key}
              </button>
            ))}
            {[
              { key: "1" },
              { key: "2" },
              { key: "3" },
              { key: "+", isOperator: true },
            ].map(({ key, isOperator }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={cn(baseButtonClass, isOperator && operatorButtonClass)}
                style={{
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                {key}
              </button>
            ))}
            {[
              { key: "0" },
              { key: "00" },
              { key: "," },
              { key: "=" },
            ].map(({ key }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={baseButtonClass}
                style={{
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUseResult}
            className="w-full h-9 mt-2 rounded-md border text-sm font-medium bg-transparent hover:bg-secondary transition-colors"
            style={{
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
            }}
          >
            Usar {displayResult}
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}