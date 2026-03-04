import { useState } from "react";
import { evaluate, format } from "mathjs";
import { Code, Beaker } from "lucide-react";

export default function CalculatorView() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [mode, setMode] = useState<"scientific" | "programmer">("scientific");

  const handleInput = (val: string) => {
    if (result === "Error") setResult("0");
    setExpression((prev) => prev + val);
  };

  const calculate = () => {
    try {
      if (!expression) return;
      const toEval = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "pi")
        .replace(/√/g, "sqrt");

      const res = evaluate(toEval);
      setResult(format(res, { precision: 14 }));
      setExpression(format(res, { precision: 14 }));
    } catch (e) {
      setResult("Error");
    }
  };

  const clear = () => {
    setExpression("");
    setResult("0");
  };

  const backspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const scientificButtons = [
    ["sin(", "cos(", "tan(", "pi"],
    ["asin(", "acos(", "atan(", "e"],
    ["log(", "ln(", "sqrt(", "^"],
    ["(", ")", "%", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "C", "="],
  ];

  const programmerButtons = [
    ["hex(", "oct(", "bin(", "<<"],
    ["and", "or", "xor", ">>"],
    ["A", "B", "C", "D"],
    ["E", "F", "(", ")"],
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "C", "+"],
    ["=", "not", "", ""],
  ];

  const buttons = mode === "scientific" ? scientificButtons : programmerButtons;

  return (
    <div className="flex flex-col h-full p-4 md:p-8 overflow-y-auto bg-white dark:bg-zinc-950">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Calculadora</h2>
          <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => setMode("scientific")}
              className={`p-2 rounded-lg flex items-center transition-colors ${
                mode === "scientific"
                  ? "bg-emerald-500 text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Beaker className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Científica</span>
            </button>
            <button
              onClick={() => setMode("programmer")}
              className={`p-2 rounded-lg flex items-center transition-colors ${
                mode === "programmer"
                  ? "bg-emerald-500 text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Informàtica</span>
            </button>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-4 mb-6 text-right border border-zinc-200 dark:border-zinc-800/50 shadow-inner">
            <div className="text-zinc-500 h-6 text-sm overflow-hidden font-mono tracking-wider">
              {expression || "\u00A0"}
            </div>
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 overflow-hidden font-mono tracking-tight mt-1">
              {result}
            </div>
            {mode === "programmer" &&
              result !== "Error" &&
              !isNaN(Number(result)) && (
                <div className="flex justify-between mt-4 text-xs text-zinc-500 font-mono border-t border-zinc-200 dark:border-zinc-800/50 pt-2">
                  <div>HEX: {Number(result).toString(16).toUpperCase()}</div>
                  <div>BIN: {Number(result).toString(2)}</div>
                </div>
              )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {buttons.map((row, i) =>
              row.map((btn, j) => {
                if (!btn) return <div key={`${i}-${j}`} />;

                const isOperator = ["+", "-", "*", "/", "=", "C"].includes(btn);
                const isAction = btn === "=" || btn === "C";

                return (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => {
                      if (btn === "C") clear();
                      else if (btn === "=") calculate();
                      else handleInput(btn);
                    }}
                    className={`
                      h-14 rounded-2xl text-lg font-medium transition-all active:scale-95 shadow-sm
                      ${
                        isAction
                          ? btn === "="
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                          : isOperator
                            ? "bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                            : "bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-transparent"
                      }
                    `}
                  >
                    {btn.replace("*", "×").replace("/", "÷")}
                  </button>
                );
              }),
            )}
            <button
              onClick={backspace}
              className="col-span-4 h-12 mt-2 rounded-2xl bg-zinc-200 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all active:scale-95 text-sm font-medium shadow-sm"
            >
              Esborrar últim (Backspace)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
