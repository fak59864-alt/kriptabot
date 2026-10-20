import React, { useState } from 'react';
import { FarmSummary, GameState, formatHashrate } from '../game/engine';

interface SavePauseModalProps {
  isOpen: boolean;
  state: GameState;
  summary: FarmSummary;
  offlineReport: {
    secondsAway: number;
    btcEarned: number;
    usdBillsPaid: number;
  } | null;
  onClose: () => void;
  onImportSave: (rawJson: string) => boolean;
  onResetGame: () => void;
  onGoToTitle: () => void;
}

export const SavePauseModal: React.FC<SavePauseModalProps> = ({
  isOpen,
  state,
  summary,
  offlineReport,
  onClose,
  onImportSave,
  onResetGame,
  onGoToTitle,
}) => {
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen && !offlineReport) return null;

  const handleCopySave = () => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
      navigator.clipboard?.writeText(encoded);
      setImportText(encoded);
      setStatusMsg('Код сохранения скопирован в буфер обмена и текстовое поле');
    } catch {
      setStatusMsg('Не удалось скопировать автоматически — скопируйте строку из поля');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setStatusMsg('Вставьте строку сохранения перед импортом');
      return;
    }
    const ok = onImportSave(importText.trim());
    if (ok) {
      setStatusMsg('Сохранение успешно загружено!');
      setTimeout(() => onClose(), 500);
    } else {
      setStatusMsg('Ошибка: неверный формат кода сохранения');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Управление сохранением и пауза"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1C1C1E] border border-white/[0.12] rounded-[24px] p-5 sm:p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {offlineReport ? 'Отчет оффлайн-майнинга' : 'Пауза и Управление сейвом'}
            </h2>
            <p className="text-xs text-zinc-400">
              Автосохранение в localStorage каждые 5 секунд
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold cursor-pointer"
          >
            Продолжить
          </button>
        </div>

        {/* Offline Progress Summary if returning */}
        {offlineReport && (
          <div className="bg-[#2C2C2E] border border-[#30D158]/40 rounded-2xl p-4 space-y-2 text-xs tabular-nums">
            <div className="text-sm font-bold text-[#30D158]">
              Ферма работала автономно ({offlineReport.secondsAway} сек)
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Намайнено за время отсутствия:</span>
              <span className="font-bold text-[#FF9F0A]">+{offlineReport.btcEarned.toFixed(6)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Оплачено счетов за электричество:</span>
              <span className="font-bold text-[#FF453A]">-${offlineReport.usdBillsPaid.toFixed(0)} USD</span>
            </div>
          </div>
        )}

        {/* Run Telemetry Snapshot */}
        <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
          <div className="bg-[#2C2C2E] rounded-2xl p-3">
            <div className="text-[10px] text-zinc-400">Общий Хешрейт</div>
            <div className="text-sm font-bold text-[#0A84FF] mt-0.5">
              {formatHashrate(summary.totalHashrateGhs)}
            </div>
          </div>
          <div className="bg-[#2C2C2E] rounded-2xl p-3">
            <div className="text-[10px] text-zinc-400">Добыто за карьеру</div>
            <div className="text-sm font-bold text-[#FF9F0A] mt-0.5">
              {state.totalBtcMined.toFixed(5)} BTC
            </div>
          </div>
          <div className="bg-[#2C2C2E] rounded-2xl p-3">
            <div className="text-[10px] text-zinc-400">Квантовый КПД</div>
            <div className="text-sm font-bold text-[#BF5AF2] mt-0.5">
              ×{state.quantumMultiplier.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Export / Import Save */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="save-code-textarea" className="text-xs font-semibold text-zinc-300">
              Экспорт / Импорт кода сохранения
            </label>
            <button
              type="button"
              onClick={handleCopySave}
              className="text-xs font-semibold text-[#0A84FF] hover:underline cursor-pointer"
            >
              Экспортировать текущий сейв
            </button>
          </div>
          <textarea
            id="save-code-textarea"
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Нажмите «Экспортировать» или вставьте сюда сохраненный код..."
            className="w-full rounded-xl bg-black border border-white/[0.12] p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-[#0A84FF]"
          />
          {statusMsg && <p className="text-xs text-[#30D158]">{statusMsg}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer"
            >
              Импортировать сейв
            </button>

            <button
              type="button"
              onClick={onGoToTitle}
              className="px-4 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-zinc-300 cursor-pointer"
            >
              Экран приветствия
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="px-4 py-2 rounded-xl bg-[#FF453A]/15 hover:bg-[#FF453A]/25 text-xs font-semibold text-[#FF453A] cursor-pointer"
              >
                Сбросить прогресс
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetGame();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#FF453A] text-white text-xs font-bold cursor-pointer"
              >
                Подтвердить полный сброс
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
