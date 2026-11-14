import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types';
import { ChevronDown, Check, Package } from 'lucide-react';

interface ProductDropdownProps {
  selectedProductId: string;
  products: Product[];
  onChange: (productId: string) => void;
  lang: 'km' | 'en';
}

interface Coords {
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUpwards: boolean;
}

export const ProductDropdown: React.FC<ProductDropdownProps> = ({
  selectedProductId,
  products,
  onChange,
  lang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Calculate coordinates when opening
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(products.length * 60 + 50, 320);
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
    const menuWidth = Math.min(Math.max(rect.width, 380), window.innerWidth - 24);
    const leftPos = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: leftPos,
      width: menuWidth,
      openUpwards: openUp,
    });
  }, [products.length]);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (event: Event) => {
      // If scrolling inside the dropdown menu itself, do not close
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelect = (productId: string) => {
    onChange(productId);
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1 min-w-0">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between py-2 sm:py-2.5 px-3.5 bg-white border rounded-xl text-left transition duration-150 cursor-pointer shadow-2xs outline-none ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/15'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15'
        }`}
      >
        <div className="flex-1 min-w-0 mr-2">
          {selectedProduct ? (
            <div className="leading-snug truncate">
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                {selectedProduct.name_kh}
              </span>
              {' '}
              <span className="text-slate-500 text-xs font-normal">
                ({selectedProduct.name_en})
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-normal text-slate-400">
              {lang === 'km' ? 'ជ្រើសរើសមុខទំនិញ...' : 'Select product...'}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Floating Menu rendered via Portal into document.body to avoid any table overflow clipping */}
      {isOpen && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.openUpwards ? 'auto' : `${coords.top}px`,
            bottom: coords.openUpwards ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className="bg-white rounded-xl border-2 border-slate-200 shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in duration-150 divide-y divide-slate-100"
        >
          {/* Empty / Unselect option */}
          <div
            onClick={() => handleSelect('')}
            className={`px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
              !selectedProductId
                ? 'bg-blue-50/80 text-blue-700 font-bold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>{lang === 'km' ? '-- ជ្រើសរើសទំនិញ --' : '-- Select Product --'}</span>
            {!selectedProductId && <Check className="w-4 h-4 text-blue-600" />}
          </div>

          {/* Product Items */}
          {products.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`px-3.5 py-2.5 cursor-pointer transition flex items-center space-x-3 ${
                  isSelected
                    ? 'bg-blue-50/90 text-blue-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="leading-snug">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {p.name_kh}
                    </span>
                    {' '}
                    <span className="text-slate-500 text-xs font-normal">
                      ({p.name_en})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">
                      {p.packaging_spec}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {p.unit}
                    </span>
                  </div>
                </div>

                {/* Weight badge & Check */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-black">
                    {p.unit_weight_kg} kg
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};
