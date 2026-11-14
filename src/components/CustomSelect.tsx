import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  logo?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuWidth?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = '-- Select --',
  className = '',
  buttonClassName = '',
  menuWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2 sm:py-2.5 bg-white border rounded-xl text-left transition shadow-2xs outline-none cursor-pointer ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/15'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15'
        } ${buttonClassName}`}
      >
        <div className="flex items-center space-x-2 min-w-0 mr-2">
          {selectedOption?.logo && (
            <div className="w-5 h-5 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <img
                src={selectedOption.logo}
                alt={selectedOption.label}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <div className="truncate">
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-400 ml-1.5 font-normal">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-normal text-slate-400">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 py-1.5 divide-y divide-slate-50 ${
            menuWidth || 'w-full min-w-[200px]'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-50/80 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                  {opt.logo && (
                    <div className="w-5 h-5 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={opt.logo}
                        alt={opt.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  {opt.icon && (
                    <span className="shrink-0 text-slate-400">{opt.icon}</span>
                  )}
                  <div className="truncate">
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-xs text-slate-400 ml-1.5 font-normal">
                        ({opt.sublabel})
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
