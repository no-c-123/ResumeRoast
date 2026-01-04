import React from 'react';

export const MonthYearInput = ({ label, value, onChange, disabled }) => {

    const handleMonthChange = (e) => {
        const month = e.target.value;
        if (!month) {
            if (value && value.length >= 4) {
                const year = value.substring(0, 4);
                onChange(`${year}`);
            } else {
                onChange('');
            }
        } else {
            const year = value && value.length >= 4 ? value.substring(0, 4) : new Date().getFullYear();
            onChange(`${year}-${month}`);
        }
    };

    const handleYearChange = (e) => {
        const year = e.target.value;
        const month = value && value.length >= 7 ? value.substring(5, 7) : '01';
        if (year.length === 4) {
            onChange(`${year}-${month}`);
        } else {
            onChange(year);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-400">{label}</label>
            <div className="relative">
                <input
                    type="month"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full bg-[#111] border rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed border-neutral-800' :
                        'border-neutral-700 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                />
            </div>
        </div>
    );
};
