import React from 'react';

export const InputField = ({ label, value, onChange, placeholder, type = "text", error, icon, helper, disabled }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-400">
            {label} {error && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full bg-[#111] border rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed border-neutral-800' :
                    error
                        ? 'border-red-500 focus:ring-red-500/20'
                        : value
                            ? 'border-green-500/30 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-neutral-700 focus:border-orange-500 focus:ring-orange-500/20'
                    }`}
            />
            {value && !error && !disabled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    ✓
                </div>
            )}
        </div>
        {helper && <p className="text-xs text-neutral-500">{helper}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);
